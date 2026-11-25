// TamTam/CreatureLit — sprite shader for painted creatures under the URP 2D Renderer.
// _MainTex is painted in the reference palette (Brasa). The secondary texture _TintMask says what each pixel is:
//   R = base family, G = accent family, A = glow family  → recoloured by ratio: tex / _Ref* × genome colour
//   B = emissive                                          → ignores 2D lights and goes over 1.0 so Bloom catches it
// Works with SpriteSkin (2D Animation) through the SKINNED_SPRITE keyword, like Sprite-Lit-Default.
Shader "TamTam/CreatureLit"
{
    Properties
    {
        _MainTex("Painted", 2D) = "white" {}
        _TintMask("Tint mask (R base, G accent, B emissive, A glow)", 2D) = "black" {}
        _NormalMap("Normal Map", 2D) = "bump" {}
        _BaseColor("Base colour", Color) = (0.490, 0.141, 0.188, 1)
        _AccentColor("Accent colour", Color) = (1, 0.478, 0.141, 1)
        _GlowColor("Glow colour", Color) = (1, 0.702, 0.278, 1)
        _EyeColor("Eye colour", Color) = (1, 0.761, 0.278, 1)
        _RefBase("Painted base (reference)", Color) = (0.490, 0.141, 0.188, 1)
        _RefAccent("Painted accent (reference)", Color) = (1, 0.478, 0.141, 1)
        _RefGlow("Painted glow (reference)", Color) = (1, 0.702, 0.278, 1)
        _Emission("Emission (genome / lustre)", Range(0, 2)) = 1
        _EmissionStrength("Emission HDR boost", Range(0, 6)) = 1.6
        _Iridescence("Iridescence", Range(0, 1)) = 0
        _GroundAO("Ground contact occlusion", Range(0, 1)) = 0
        _GroundAOHeight("Ground AO height (object units)", Float) = 0.6
        _RimColor("Rim light (family glow)", Color) = (1, 1, 1, 1)
        _RimStrength("Rim strength", Range(0, 2)) = 0
        _RimWidth("Rim width (texels)", Range(1, 12)) = 4
        _AutoEmission("Auto emission of bright saturated paint", Range(0, 2)) = 0
        _EmitThreshold("Auto emission value threshold", Range(0.4, 1)) = 0.84
        _Mutation("Mutation (0 none, 1 melanic, 2 albino, 3 aurora, 4 iridescent)", Float) = 0
        [HideInInspector] _Color("Tint", Color) = (1,1,1,1)
        [HideInInspector] _RendererColor("RendererColor", Color) = (1,1,1,1)
        [HideInInspector] _AlphaTex("External Alpha", 2D) = "white" {}
        [HideInInspector] _EnableExternalAlpha("Enable External Alpha", Float) = 0
    }

    HLSLINCLUDE
        #define TAMTAM_CBUFFER \
            CBUFFER_START(UnityPerMaterial) \
                half4 _Color; half4 _BaseColor; half4 _AccentColor; half4 _GlowColor; half4 _EyeColor; \
                half4 _RefBase; half4 _RefAccent; half4 _RefGlow; \
                half _Emission; half _EmissionStrength; half _Iridescence; half _GroundAO; half _GroundAOHeight; \
                half4 _RimColor; half _RimStrength; half _RimWidth; half _AutoEmission; half _EmitThreshold; half _Mutation; \
                float4 _MainTex_TexelSize; \
            CBUFFER_END
    ENDHLSL

    SubShader
    {
        Tags { "Queue" = "Transparent" "RenderType" = "Transparent" "RenderPipeline" = "UniversalPipeline" }
        Blend SrcAlpha OneMinusSrcAlpha, One OneMinusSrcAlpha
        Cull Off
        ZWrite Off

        Pass
        {
            Tags { "LightMode" = "Universal2D" }
            HLSLPROGRAM
            #include "Packages/com.unity.render-pipelines.universal/Shaders/2D/Include/Core2D.hlsl"
            #pragma vertex LitVertex
            #pragma fragment LitFragment
            #include_with_pragmas "Packages/com.unity.render-pipelines.universal/Shaders/2D/Include/ShapeLightShared.hlsl"
            #pragma multi_compile_instancing
            #pragma multi_compile _ DEBUG_DISPLAY
            #pragma multi_compile _ SKINNED_SPRITE

            struct Attributes { COMMON_2D_INPUTS half4 color : COLOR; UNITY_SKINNED_VERTEX_INPUTS };
            struct Varyings { COMMON_2D_LIT_OUTPUTS half4 color : COLOR; float aoY : TEXCOORD7; };

            #include "Packages/com.unity.render-pipelines.universal/Shaders/2D/Include/Lit2DCommon.hlsl"
            TEXTURE2D(_TintMask); SAMPLER(sampler_TintMask);
            TAMTAM_CBUFFER

            Varyings LitVertex(Attributes input)
            {
                UNITY_SKINNED_VERTEX_COMPUTE(input);
                SetUpSpriteInstanceProperties();
                input.positionOS = UnityFlipSprite(input.positionOS, unity_SpriteProps.xy);
                Varyings o = CommonLitVertex(input);
                o.color = input.color * _Color * unity_SpriteColor;
                o.aoY = input.positionOS.y;
                return o;
            }

            half3 RgbToHsv(half3 c)
            {
                half4 K = half4(0.0h, -1.0h / 3.0h, 2.0h / 3.0h, -1.0h);
                half4 p = lerp(half4(c.bg, K.wz), half4(c.gb, K.xy), step(c.b, c.g));
                half4 q = lerp(half4(p.xyw, c.r), half4(c.r, p.yzx), step(p.x, c.r));
                half d = q.x - min(q.w, q.y);
                return half3(abs(q.z + (q.w - q.y) / (6.0h * d + 1e-4h)), d / (q.x + 1e-4h), q.x);
            }
            half3 HsvToRgb(half3 c)
            {
                half3 p = abs(frac(c.xxx + half3(1.0h, 2.0h / 3.0h, 1.0h / 3.0h)) * 6.0h - 3.0h);
                return c.z * lerp(half3(1, 1, 1), saturate(p - 1.0h), c.y);
            }
            // Moves the pixel from the painted reference colour to the genome colour in HSV, keeping the
            // painter's per-pixel hue/value variation (identity when genome == reference).
            half3 Shift(half3 tex, half3 refC, half3 newC)
            {
                half3 t = RgbToHsv(tex), r = RgbToHsv(refC), n = RgbToHsv(newC);
                t.x = frac(t.x + n.x - r.x);
                t.y = saturate(t.y * n.y / max(r.y, 0.05h));
                t.z = t.z * n.z / max(r.z, 0.05h);
                return HsvToRgb(t);
            }
            half3 Recolor(half3 tex, half4 m)
            {
                half keep = saturate(1.0h - m.r - m.g - m.a);
                return tex * keep + Shift(tex, _RefBase.rgb, _BaseColor.rgb) * m.r
                     + Shift(tex, _RefAccent.rgb, _AccentColor.rgb) * m.g + Shift(tex, _RefGlow.rgb, _GlowColor.rgb) * m.a;
            }

            half4 LitFragment(Varyings input) : SV_Target
            {
                half4 tex = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, input.uv);
                half4 m = SAMPLE_TEXTURE2D(_TintMask, sampler_TintMask, input.uv);
                half3 col = Recolor(tex.rgb, m);
                // Iridescent mutation: hue film that drifts along the body.
                half ph = input.uv.x * 6.0h + input.uv.y * 3.0h + _Time.y * 0.6h;
                half3 film = 0.5h + 0.5h * cos(ph + half3(0.0h, 2.1h, 4.2h));
                col = lerp(col, col * (0.55h + film), _Iridescence * m.r * 0.6h);

                // Emissive zones of painted art (flames, crystals, plasma, halos): bright AND saturated paint.
                half vmax = max(col.r, max(col.g, col.b)), vmin = min(col.r, min(col.g, col.b));
                half sat = (vmax - vmin) / max(vmax, 1e-3h);
                half autoE = smoothstep(_EmitThreshold, 1.0h, vmax) * smoothstep(0.3h, 0.75h, sat) * _AutoEmission;

                // Mutations as a material variation (not a flat tint): value/saturation/hue response of the paint.
                half lum = dot(col, half3(0.2126h, 0.7152h, 0.0722h));
                int mut = (int)round(_Mutation);
                if (mut == 1)      // melanic: dark, low-saturation scales; bright accents survive as embers
                    col = lerp(col, lum * half3(0.30h, 0.25h, 0.34h) * 0.85h, 0.78h * (1.0h - autoE));
                else if (mut == 2) // albino: pale pigment-free body with warm translucency
                    col = lerp(col, saturate(lum * 1.25h + half3(0.10h, 0.07h, 0.08h)), 0.8h);
                else if (mut == 3) // aurora: hue drifts toward teal/green on the saturated paint, cool sheen on the rest
                {
                    half3 hsv = RgbToHsv(col);
                    hsv.x = frac(hsv.x + 0.32h * sat + 0.04h * sin(_Time.y * 0.8h + input.uv.y * 6.0h));
                    col = lerp(HsvToRgb(hsv), col, 0.15h);
                    autoE = max(autoE, 0.35h * sat * smoothstep(0.5h, 1.0h, vmax));
                }
                else if (mut == 4) // iridescent: thin-film rainbow over the whole body
                    col = lerp(col, col * (0.55h + film), 0.55h);
                half4 main = input.color * half4(col, tex.a);
                // Contact occlusion: the painting darkens softly where it meets the ground (object y = 0 at the feet).
                half ao = saturate(input.aoY / max(_GroundAOHeight, 0.01h));
                main.rgb *= lerp(1.0h - _GroundAO, 1.0h, ao * ao * (3.0h - 2.0h * ao));

                SurfaceData2D surfaceData;
                InputData2D inputData;
                const half3 normalTS = UnpackNormal(SAMPLE_TEXTURE2D(_NormalMap, sampler_NormalMap, input.uv));
                InitializeSurfaceData(main.rgb, main.a, half4(1, 1, 1, 1), normalTS, surfaceData);
                InitializeInputData(input.uv, input.lightingUV, inputData);
            #if defined(DEBUG_DISPLAY)
                SETUP_DEBUG_TEXTURE_DATA_2D_NO_TS(inputData, input.positionWS, input.positionCS, _MainTex);
                surfaceData.normalWS = input.normalWS;
            #endif
                half4 lit = CombinedShapeLightShared(surfaceData, inputData);
                half e = max(m.b * _Emission, autoE);
                lit.rgb = lit.rgb * (1.0h - saturate(e)) + main.rgb * e * (1.0h + _EmissionStrength);

                // Rim light (back light in the family glow): alpha drops toward the upper-right edge of the silhouette.
                if (_RimStrength > 0.001h)
                {
                    float2 px = _MainTex_TexelSize.xy * _RimWidth;
                    half a1 = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, input.uv + float2(px.x, 0)).a;
                    half a2 = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, input.uv + float2(0, px.y)).a;
                    half a3 = SAMPLE_TEXTURE2D(_MainTex, sampler_MainTex, input.uv + px * 0.7071).a;
                    half rim = saturate(tex.a - min(a1, min(a2, a3)));
                    lit.rgb += _RimColor.rgb * rim * _RimStrength * main.a;
                }
                return lit;
            }
            ENDHLSL
        }

        Pass
        {
            Tags { "LightMode" = "NormalsRendering" }
            HLSLPROGRAM
            #include "Packages/com.unity.render-pipelines.universal/Shaders/2D/Include/Core2D.hlsl"
            #pragma vertex NormalsRenderingVertex
            #pragma fragment NormalsRenderingFragment
            #pragma multi_compile_instancing
            #pragma multi_compile _ SKINNED_SPRITE
            struct Attributes { COMMON_2D_NORMALS_INPUTS float4 color : COLOR; UNITY_SKINNED_VERTEX_INPUTS };
            struct Varyings { COMMON_2D_NORMALS_OUTPUTS half4 color : COLOR; };
            #include "Packages/com.unity.render-pipelines.universal/Shaders/2D/Include/Normals2DCommon.hlsl"
            TAMTAM_CBUFFER
            Varyings NormalsRenderingVertex(Attributes input)
            {
                UNITY_SKINNED_VERTEX_COMPUTE(input);
                SetUpSpriteInstanceProperties();
                input.positionOS = UnityFlipSprite(input.positionOS, unity_SpriteProps.xy);
                Varyings o = CommonNormalsVertex(input);
                o.color = input.color * _Color * unity_SpriteColor;
                return o;
            }
            half4 NormalsRenderingFragment(Varyings input) : SV_Target { return CommonNormalsFragment(input, input.color); }
            ENDHLSL
        }

        Pass
        {
            Tags { "LightMode" = "UniversalForward" "Queue" = "Transparent" "RenderType" = "Transparent" }
            HLSLPROGRAM
            #include "Packages/com.unity.render-pipelines.universal/Shaders/2D/Include/Core2D.hlsl"
            #pragma vertex UnlitVertex
            #pragma fragment UnlitFragment
            struct Attributes { COMMON_2D_INPUTS half4 color : COLOR; UNITY_SKINNED_VERTEX_INPUTS };
            struct Varyings { COMMON_2D_OUTPUTS half4 color : COLOR; };
            #include "Packages/com.unity.render-pipelines.universal/Shaders/2D/Include/2DCommon.hlsl"
            #pragma multi_compile_instancing
            #pragma multi_compile _ DEBUG_DISPLAY SKINNED_SPRITE
            TAMTAM_CBUFFER
            Varyings UnlitVertex(Attributes input)
            {
                UNITY_SKINNED_VERTEX_COMPUTE(input);
                SetUpSpriteInstanceProperties();
                input.positionOS = UnityFlipSprite(input.positionOS, unity_SpriteProps.xy);
                Varyings o = CommonUnlitVertex(input);
                o.color = input.color * _Color * unity_SpriteColor;
                return o;
            }
            half4 UnlitFragment(Varyings input) : SV_Target { return CommonUnlitFragment(input, input.color); }
            ENDHLSL
        }
    }
    Fallback "Universal Render Pipeline/2D/Sprite-Lit-Default"
}

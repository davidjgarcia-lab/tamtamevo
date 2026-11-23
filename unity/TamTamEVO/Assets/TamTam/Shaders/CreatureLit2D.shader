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
                half _Emission; half _EmissionStrength; half _Iridescence; \
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
            struct Varyings { COMMON_2D_LIT_OUTPUTS half4 color : COLOR; };

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
                return o;
            }

            half3 Recolor(half3 tex, half4 m)
            {
                half3 rb = _BaseColor.rgb / max(_RefBase.rgb, 0.02h);
                half3 ra = _AccentColor.rgb / max(_RefAccent.rgb, 0.02h);
                half3 rg = _GlowColor.rgb / max(_RefGlow.rgb, 0.02h);
                half keep = saturate(1.0h - m.r - m.g - m.a);
                return tex * (keep + m.r * rb + m.g * ra + m.a * rg);
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
                half4 main = input.color * half4(col, tex.a);

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
                half e = m.b * _Emission;
                lit.rgb = lit.rgb * (1.0h - saturate(e)) + main.rgb * e * (1.0h + _EmissionStrength);
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

export const pointVertexShader = /* glsl */ `
  attribute float lifetime;
  attribute float aSize;
  varying float vLifetime;

  void main() {
    vLifetime = lifetime;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 28.0 * lifetime * aSize;
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const pointFragmentShader = /* glsl */ `
  varying float vLifetime;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    // Two-layer exponential falloff: soft halo + overexposed core
    float glow = exp(-dist * 10.0);
    float core = exp(-dist * 40.0);
    float intensity = glow + core * 2.0;

    vec3 color = mix(vec3(0.3, 1.0, 0.7), vec3(0.5, 1.0, 0.9), vLifetime);

    gl_FragColor = vec4(color, intensity * vLifetime);
  }
`

// ---------------------------------------------------------------------------
// Earth globe — day/night/clouds/atmosphere overlay
// ---------------------------------------------------------------------------

export const earthVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const earthFragmentShader = /* glsl */ `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform sampler2D brcTexture;        // R=bump, G=roughness, B=clouds
  uniform vec3 sunDirection;           // world-space, normalized
  uniform vec3 atmosphereDayColor;
  uniform vec3 atmosphereTwilightColor;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);

    // Dot of surface normal with sun direction
    float sunOrientation = dot(normal, sunDirection);

    // Fresnel — view direction FROM surface TO camera
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDir, normal));

    // Sample textures
    vec3 dayColor   = texture2D(dayTexture,   vUv).rgb;
    vec3 nightColor = texture2D(nightTexture, vUv).rgb;
    vec4 brc        = texture2D(brcTexture,   vUv);

    // Clouds from blue channel — brighten surface where clouds appear
    float cloudStrength = smoothstep(0.6, 1.0, brc.b);
    vec3 surfaceColor = mix(dayColor, vec3(1.0), min(cloudStrength * 1.0, 1.0));

    // Day / night blend — smooth terminator
    float dayStrength = smoothstep(-0.25, 0.5, sunOrientation);
    vec3 finalColor = mix(nightColor, surfaceColor, dayStrength);

    // Thin atmosphere overlay on the globe limb
    vec3 atmosphereColor = mix(
      atmosphereTwilightColor,
      atmosphereDayColor,
      smoothstep(-0.25, 0.75, sunOrientation)
    );
    float atmosphereDayStrength = smoothstep(-0.5, 1.0, sunOrientation);
    float atmosphereMix = clamp(atmosphereDayStrength * pow(fresnel, 2.0), 0.0, 1.0);
    finalColor = mix(finalColor, atmosphereColor, atmosphereMix);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

// ---------------------------------------------------------------------------
// Atmosphere shell — rendered BackSide to create the glowing halo
// ---------------------------------------------------------------------------

export const atmosphereShellVertexShader = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const atmosphereShellFragmentShader = /* glsl */ `
  uniform vec3 sunDirection;
  uniform vec3 atmosphereDayColor;
  uniform vec3 atmosphereTwilightColor;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);

    // FROM camera TO surface (matches TSL: positionWorld - cameraPosition)
    vec3 viewDir = normalize(vWorldPosition - cameraPosition);
    float fresnel = 1.0 - abs(dot(viewDir, normal));

    float sunOrientation = dot(normal, sunDirection);

    // Remap fresnel [0.73, 1] → [1, 0], then cube it  (matches TSL .remap().pow(3))
    float alpha = clamp(1.0 - (fresnel - 0.73) / (1.0 - 0.73), 0.0, 1.0);
    alpha = pow(alpha, 3.0);

    // Fade out on the night side
    float sunStr = smoothstep(-0.5, 1.0, sunOrientation);
    alpha = clamp(alpha * sunStr, 0.0, 1.0);

    vec3 atmosphereColor = mix(
      atmosphereTwilightColor,
      atmosphereDayColor,
      smoothstep(-0.25, 0.75, sunOrientation)
    );

    gl_FragColor = vec4(atmosphereColor, alpha);
  }
`

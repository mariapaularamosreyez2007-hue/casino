# Plan de Calidad Superior y Animaciones Complejas (Clon Idéntico a Stake)

Plan de arquitectura y renderizado visual para transformar los juegos de ASTED en experiencias interactivas HD idénticas a los títulos originales de Stake, implementando motores Canvas 2D acelerados con simulación física continua, trazado de partículas, cinemáticas de victoria y texturas nativas.

---

## Decisiones Críticas y Preferencias Confirmadas

> [!IMPORTANT]
> **Elecciones confirmadas con el usuario:**
> - **Tecnología de Animación:** Canvas 2D acelerado con físicas avanzadas de colisión por subpasos, aceleración gravitacional y generador dinámico de partículas.
> - **Alcance de Juegos:** Implementación integral en **todos los juegos** del catálogo (Mines, Plinko, Crash, Dice, Ruleta y Slots/Gates of Asted).

---

## 1. Visión General y Desglose por Juego

El objetivo es eliminar cualquier apariencia estática o genérica mediante renderizado por hardware en tiempo real a 60 FPS, interpolación suave de estado, efectos de iluminación radial y retroalimentación háptica/sonora idéntica a la plataforma oficial de Stake.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MOTORES HD POR JUEGO                            │
├───────────────┬────────────────────────────┬───────────────────────────┤
│ Juego         │ Animaciones Clave          │ Físicas y Renderizado     │
├───────────────┼────────────────────────────┼───────────────────────────┤
│ MINES HD      │ 3D Tile Flip con sombras,  │ Renderizado procedural    │
│               │ brillo especular de gemas, │ de mallas vectoriales,    │
│               │ detonación con humo y onda │ partículas de chispa      │
├───────────────┼────────────────────────────┼───────────────────────────┤
│ PLINKO HD     │ Clavijas con halo elástico,│ Integración Verlet/Euler, │
│               │ micro-rebotes precisos,    │ estelas de bola con blur, │
│               │ bins con rebote resorte    │ respuesta de multiplicador│
├───────────────┼────────────────────────────┼───────────────────────────┤
│ CRASH HD      │ Rejilla isométrica móvil,  │ Ecuación exponencial viva,│
│               │ propulsión con partículas, │ onda de choque de crash,  │
│               │ estrellas de fondo veloces │ pitch de sonido dinámico  │
├───────────────┼────────────────────────────┼───────────────────────────┤
│ DICE HD       │ Giro tridimensional rápido,│ Slider de doble carril    │
│               │ desaceleración con rebote, │ reactivo, efecto neón,    │
│               │ parada con efecto destello │ cálculo instantáneo 99%RTP│
├───────────────┼────────────────────────────┼───────────────────────────┤
│ RULETA HD     │ Giro inercial de rueda,    │ Rueda desacelerando con   │
│               │ rebote de bola entre fosas,│ rozamiento real, fichas en│
│               │ iluminación de número gana │ paño verde de alta textura│
├───────────────┼────────────────────────────┼───────────────────────────┤
│ SLOTS HD      │ Cascada / Tumble cayendo,  │ Explosión de símbolos,    │
│ (Gates Asted) │ rayos de Zeus con orbes,   │ orbes multiplicadores 500x│
│               │ modo Free Spins ardiente   │ que caen con estela dorada│
└───────────────┴────────────────────────────┴───────────────────────────┘
```

---

## 2. Experiencia de Usuario y Especificaciones Visuales

### A. Mines HD (Originales de Stake)
- **Fase de Selección**: Malla 5x5 con relieve biselado y acabado de textura metalizada oscura (`#1a2c38` / `#213743`). Efecto hover con elevación sutil y cursor pointer.
- **Cinemática de Apertura**: Al hacer clic, la baldosa realiza una rotación 3D sobre el eje Y (`rotateY(180deg)`) con una duración de 220ms.
- **Gema Revelada**: Renderizado vectorial de esmeralda facetada con 6 caras geométricas, gradientes de luz interior, destello rotativo de 4 puntas y partículas brillantes flotantes.
- **Bomba Detonada**: Al impactar una mina, se activa una sacudida de pantalla (*screen-shake*) de 350ms, una onda de choque circular roja expansiva y humo volumétrico simulado.
- **Franja Superior de Multiplicadores**: Tira horizontal superior que avanza automáticamente, iluminando en verde neón (`#00e701`) el multiplicador alcanzado.

### B. Plinko HD (Físicas de Precisión)
- **Simulación Física**: Algoritmo de integración continua con detección de colisión círculo-círculo contra clavijas cilíndricas reflectantes.
- **Estela de Movimiento**: Cada bola dibuja una estela semitransparente de 3 cuadros para simular velocidad natural.
- **Reacción de Clavija**: Al ser golpeada, la clavija parpadea en blanco puro durante 60ms y emite una micro-vibración radial.
- **Impacto en Contenedores**: El contenedor inferior se hunde 4px simulando un resorte de compresión física y cambia temporalmente su gradiente a un brillo intenso con el texto del multiplicador saltando en escala (1.25x).

### C. Crash HD (Cohete Espacial)
- **Entorno Espacial**: Canvas dinámico con fondo estelar donde 60 partículas de polvo espacial se desplazan a velocidad proporcional al multiplicador actual.
- **Cohete & Propulsor**: Cohete orientado tangencialmente a la curva de ascenso con sistema de emisión de partículas de fuego (amarillo/naranja) que crecen con el tiempo.
- **Explosión de Ruptura**: Al llegar al multiplicador de Crash, el cohete se desintegra en 20 fragmentos incandescentes y una nube expansiva con sonido sordo de baja frecuencia.

### D. Dice HD (Dados 3D y Deslizador Neón)
- **Control Deslizador**: Carril de doble segmento continuo con frontera interactiva. Zona de victoria en verde fluorescente (`#00e701`) y zona de pérdida en carmesí (`#ed4245`).
- **Lanzamiento de Dados**: Dos dados que giran libremente con sombras proyectadas en perspectiva isométrica y se detienen con un chasquido mecánico sincronizado con el Web Audio.

### E. Ruleta en Español HD (Mesa de Casino en Vivo)
- **Rueda Giratoria**: Disco concéntrico de 37 casillas con madera de caoba pulida y radios de latón dorados que rotan con inercia angular.
- **Física de la Bola**: La bola blanca recorre la pista perimetral exterior perdiendo energía cinética hasta caer en una de las casillas numeradas.
- **Tapete de Apuestas**: Fieltro verde esmeralda con fichas circulares apilables ($1, $5, $10, $25, $100, $500) con bordes estriados.

### F. Gates of Asted HD (Tragamonedas de Cascada)
- **Sistema Tumble**: Los símbolos ganadores (4+ iguales) explotan con un rayo eléctrico, y los símbolos superiores caen por gravedad ocupando los espacios vacíos con rebote suave al aterrizar.
- **Orbe de Zeus Multiplicador**: Relámpagos procedurales en los bordes de la pantalla que arrojan orbes con alas doradas que contienen multiplicadores de 2x a 500x.

---

## 3. Decisiones Técnicas y Requisitos de Implementación

### Decisión 1: Canvas 2D Acelerado vs WebGL Complejo
- **Enfoque Elegido**: Canvas 2D nativo con resolución de alta densidad (`window.devicePixelRatio = 2`), renderizado por capas y física matemática directa en JavaScript/TypeScript.
- **Por qué**: Máxima compatibilidad en todos los navegadores móviles y de escritorio, latencia cero, carga instantánea y control pixel-perfect sobre partículas sin pesadas librerías externas.

### Decisión 2: Motor de Sonido Sintetizado con Web Audio API
- **Enfoque Elegido**: Generación por síntesis de frecuencia modulada (FM) y osciladores polifónicos (*sine, triangle, sawtooth*) con filtros pasa-bajos para chimes de gemas, rebotes de clavija, explosiones y campanillas de victoria.
- **Por qué**: No depende de descargas de archivos `.mp3` externos que puedan fallar en la red y permite modulación dinámica del tono en tiempo real (por ejemplo, el sonido del cohete de Crash aumentando de tono a medida que sube el multiplicador).

---

## 4. Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DE JUEGO HD                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌─────────────────────┐                 ┌────────────────────────┐   │
│   │   Bucle de Juego    │────────────────▶│   Motor de Físicas     │   │
│   │ requestAnimationFrame│                 │  (Gravedad / Rebotes)  │   │
│   └──────────┬──────────┘                 └───────────┬────────────┘   │
│              │                                        │                │
│              ▼                                        ▼                │
│   ┌─────────────────────┐                 ┌────────────────────────┐   │
│   │ Renderizado Canvas  │◀────────────────│   Sistema Partículas   │   │
│   │ (60 FPS Retina HD)  │                 │ (Destellos / Humo)     │   │
│   └──────────┬──────────┘                 └────────────────────────┘   │
│              │                                                         │
│              ▼                                                         │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │        Sincronizador Web Audio API & Estado del Usuario         │   │
│   │      (Balance, Apuesta, Multiplicador, Progreso VIP)           │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Qué se Necesita para Hacerlos 100% Idénticos a Stake

1. **Motores de Partículas Integrados**:
   - `ParticleSystem.ts`: Clase utilitaria ligera reutilizable para emitir chispas, humo, monedas doradas y destellos de gemas.
2. **Físicas de Plinko Mejoradas**:
   - Detección precisa de rebote entre bola y clavija con ángulo de restitución elástica ($e = 0.65$) y gravedad calibrada.
3. **Simulador de Lanzamiento de Crash**:
   - Curva bezier cuadrática continua con textura de cuadrícula en fuga y animación suave del cohete.
4. **Mecánica Tumble en Slots**:
   - Matriz de caída de 5x3 o 6x5 con detección de grupos ganadores y reemplazo en cascada.
5. **Sonidos de Alta Precisión**:
   - Banco completo de efectos sintetizados para cada interacción (clic de botón, moneda, jackpot, fallo).

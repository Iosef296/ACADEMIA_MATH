# OCR con créditos OpenRouter

## Modelo elegido: Gemma 4 26B A4B (pago)

Mejor balance calidad/precio para math OCR. En pruebas directas fue el único modelo free
que devolvió LaTeX limpio y correcto. La versión paga quita el rate limit.

## Setup

### 1. Cargar créditos en OpenRouter
- openrouter.ai/settings/credits → Add Credits (~$5 alcanza para meses)

### 2. El código ya está configurado
El modelo pago ya está como primario en `OcrController.java`:

```java
private static final List<String> MODELS = List.of(
    "google/gemma-4-26b-a4b-it",              // pago, primario
    "google/gemma-4-26b-a4b-it:free",         // fallback gratis mismo modelo
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "google/gemma-4-31b-it:free"
);
```

No hay cambio de código necesario — solo cargar los créditos en OpenRouter.

### 3. Costo estimado

| Escenario | Requests/mes | Costo |
|-----------|-------------|-------|
| 100 alumnos × 5 OCR/día × 30 días | 15,000 | ~$0.72 |
| 50 alumnos × 3 OCR/día × 30 días | 4,500 | ~$0.22 |

Precio: `google/gemma-4-26b-a4b-it` ≈ $0.06/1M tokens input, $0.33/1M output.
Cada request OCR ≈ 500 tokens imagen + 200 tokens respuesta.

### 4. Resultado esperado vs free

| | Versión free | Versión paga |
|---|---|---|
| Rate limit | ~60 req/día | Sin límite (según créditos) |
| Velocidad | 5-15 seg | 2-5 seg |
| Calidad LaTeX | ✅ Buena | ✅ Igual |
| Errores 429 | Frecuentes en horas pico | Ninguno |

## Si querés más calidad en el futuro

Cambiar primario a `google/gemini-2.5-flash` (~$0.15/1M tokens input):
- Más rápido que Gemma
- Mejor reconocimiento de escritura complicada
- ~2.5x más caro (~$1.80/mes para 100 alumnos)

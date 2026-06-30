# Self-Hosting de IA para OCR Matemático

## ¿Cuándo tiene sentido?

| Alumnos activos | Solución recomendada | Costo aprox/mes |
|----------------|---------------------|-----------------|
| 0 - 100 | OpenRouter free tier | $0 |
| 100 - 500 | OpenRouter + Gemma pago | $0.72 - $36 |
| 500 - 1000 | OpenRouter + Gemma pago | $36 - $252 |
| +1000 activos | Self-hosting propio | $80-150 (fijo) |

Cuando el costo de API supere ~$150/mes, self-hosting empieza a ser más barato.

---

## Componentes (todos gratuitos excepto hardware)

### HuggingFace (huggingface.co)
- Repositorio público de modelos de IA entrenados
- Google, Meta, NVIDIA, universidades suben sus modelos ahí gratis
- Se descarga el modelo como un archivo (`.gguf`, `.safetensors`)
- **Costo: $0**

### InternVL2 (modelo recomendado para math OCR)
- Desarrollado por Shanghai AI Lab
- Especializado en visión + matemáticas
- Supera a Gemma en benchmarks de OCR matemático
- Disponible en HuggingFace gratis
- **Costo: $0**

Versiones disponibles:
| Modelo | Tamaño | GPU mínima | VRAM | Velocidad | Calidad math |
|--------|--------|-----------|------|-----------|--------------|
| InternVL2-2B | 2GB | GTX 1060 | 4GB | ~5 seg | ⭐⭐⭐ |
| InternVL2-8B | 8GB | RTX 3070 | 8GB | ~3 seg | ⭐⭐⭐⭐ |
| InternVL2-26B | 26GB | RTX 4090 | 24GB | ~2 seg | ⭐⭐⭐⭐⭐ |
| InternVL2-40B | 40GB | 2× A100 | 80GB | ~1 seg | ⭐⭐⭐⭐⭐ |

**Recomendado para empezar: InternVL2-8B** — buen balance calidad/hardware.

### Ollama (ollama.com)
- Software gratuito que corre modelos de HuggingFace localmente
- Expone una API compatible con OpenAI (mismo formato que OpenRouter)
- Instalación con un comando
- **Costo: $0**

---

## Opciones de hardware

### Opción A — GPU alquilada en la nube (sin inversión inicial)

Proveedores ordenados por precio:

| Proveedor | GPU | VRAM | Precio/hora | Precio/mes (24/7) |
|-----------|-----|------|-------------|-------------------|
| Vast.ai | RTX 4090 | 24GB | ~$0.35 | ~$252 |
| RunPod | RTX 4090 | 24GB | ~$0.50 | ~$360 |
| RunPod | A100 40GB | 40GB | ~$1.00 | ~$720 |
| Lambda Labs | A10 | 24GB | ~$0.60 | ~$432 |

**Tip**: No necesitás 24/7. Si tus alumnos usan el OCR 10h/día:
- RTX 4090 en Vast.ai × 10h × 30 días = ~$105/mes

### Opción B — PC propia con GPU (inversión única)

| Componente | Precio aprox |
|------------|-------------|
| RTX 4090 (24GB VRAM) | ~$1,500 |
| RTX 3090 (24GB VRAM) | ~$800 usada |
| RTX 3080 12GB (para InternVL2-8B) | ~$400 usada |
| PC completa con RTX 4090 | ~$2,500 |

Costo operativo mensual: ~$20 (luz) + $0 de API.

**Break-even vs OpenRouter**: si pagas $150/mes de API, en 10-17 meses recuperás la inversión.

---

## Flujo de implementación

```
1. Descargar InternVL2-8B de HuggingFace
       ↓
2. Instalar Ollama en el servidor/PC
       ↓
3. Cargar el modelo en Ollama
       ↓
4. Ollama expone API en localhost:11434
       ↓
5. Exponer al internet con Cloudflare Tunnel (gratis) o ngrok
       ↓
6. Cambiar URL en OcrController.java de OpenRouter → tu servidor
```

### Cambio en OcrController.java al migrar

```java
// Antes (OpenRouter)
private static final String OR_URL = "https://openrouter.ai/api/v1/chat/completions";

// Después (servidor propio con Ollama)
private static final String OR_URL = "https://tu-servidor.com/v1/chat/completions";

// El modelo cambia a:
private static final List<String> MODELS = List.of(
    "internvl2:8b"   // nombre en Ollama
);

// Los headers de auth cambian (Ollama no necesita API key):
// headers.setBearerAuth(openRouterKey);  ← eliminar esta línea
```

La API de Ollama es compatible con OpenAI → **cambio mínimo de código**.

---

## Comparativa final

| | OpenRouter free | OpenRouter Gemma pago | Self-hosting |
|---|---|---|---|
| Costo/mes (100 alumnos) | $0 | $0.72 | $0* |
| Costo/mes (1000 alumnos) | $0 (pero falla) | $252 | $105-150 |
| Rate limits | 20 req/min compartido | ~1000 req/min | Sin límite |
| Velocidad | 5-15 seg | 2-5 seg | 1-3 seg |
| Dependencia externa | Alta | Alta | Ninguna |
| Mantenimiento | Ninguno | Ninguno | Bajo |
| Inversión inicial | $0 | $0 | $0 (nube) / $2500 (PC) |

*Con PC propia ya amortizada

---

## Ruta de crecimiento recomendada

```
Ahora         →  OpenRouter free (Gemma 4 26B)
+429 frecuentes → Cargar $5 en OpenRouter (Gemma pago)
+500 alumnos  →  Evaluar Vast.ai con InternVL2-8B (~$105/mes)
+1000 alumnos →  PC propia RTX 4090 o servidor dedicado
```

---

## Referencias

- HuggingFace InternVL2: `huggingface.co/OpenGVLab/InternVL2-8B`
- Ollama: `ollama.com`
- Vast.ai: `vast.ai`
- RunPod: `runpod.io`
- Cloudflare Tunnel (exposición gratis): `developers.cloudflare.com/cloudflare-one/connections/connect-networks`

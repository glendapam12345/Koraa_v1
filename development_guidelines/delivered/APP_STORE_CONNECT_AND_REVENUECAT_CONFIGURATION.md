# Configuración App Store Connect y alineación con RevenueCat

Documento generado a partir del escaneo del repositorio activo, `app.config.js`, dependencias y la estrategia de monetización proporcionada. Úsalo como lista de verificación al crear suscripciones en App Store Connect y al configurar RevenueCat.

**Alcance:** describe una app de productividad y bienestar con suscripción; no sustituye la revisión legal ni las guías vigentes de Apple.

### Fuente de verdad para IDs de producto

Los **ID de producto** deben coincidir **carácter a carácter** con App Store Connect y con RevenueCat. Si el documento de estrategia decía `com.kora.premium.*` pero en ASC creaste otro ID, prevalece **lo que aparece en App Store Connect**.

**Estado registrado (suscripción anual):** grupo **Subscription premium**; producto con nombre de referencia `Koraa_premium_anual`, **ID de producto** `Koraa_premium_anual`, **duración 1 año**, Apple ID interno del producto `6764197649`. Si Connect muestra **“Faltan metadatos”**, completa precios, localizaciones (nombre para mostrar, descripción) y demás campos obligatorios hasta que el estado sea válido.

---

## 1. Resumen de escaneo del repositorio

### 1.1 Expo / iOS

| Elemento | Valor en el repo |
|----------|------------------|
| Archivo de configuración | `app.config.js` (no hay `app.json` duplicado) |
| Nombre de la app (`expo.name`) | `Koraa` |
| Versión (`expo.version`) | `1.0.0` |
| Build iOS (`ios.buildNumber`) | `7` (revisar al subir nuevo binario) |
| Bundle identifier (`ios.bundleIdentifier`) | `com.impermanencecasaartisitca.koraav1` |
| Nombre mostrado iOS | `Koraa` (`CFBundleDisplayName`) |
| Archivos StoreKit (`.storekit`) | Ninguno en el repositorio |
| Plugins Expo relevantes | `expo-router`, `expo-font`, `expo-web-browser`, `expo-secure-store` |

**Nota:** el bundle contiene un posible error ortográfico (`artisitca`). Apple no exige corrección, pero conviene unificar el identificador en todo el ciclo de vida (certificados, perfiles, ASC, RevenueCat).

### 1.2 RevenueCat (código y artefactos)

| Elemento | Hallazgo |
|----------|----------|
| Dependencias NPM | `react-native-purchases` y `react-native-purchases-ui` presentes en `package.json` (^10.0.1) |
| Archivos `config/revenuecat.ts`, `lib/revenuecat.ts` | No existen en el árbol actual |
| `contexts/SubscriptionContext.tsx` | No existe |
| Pantallas o utilidades `paywall` / `PremiumLock` | No encontradas |
| Constantes `ENTITLEMENT_ID`, IDs de producto en TypeScript | No referenciadas en código fuente del proyecto raíz |
| Inicialización de `Purchases.configure` en `app/_layout.tsx` | No presente (layout actual: Auth, fuentes, analítica, notificaciones) |

**Conclusión:** el repositorio **no implementa hoy** el flujo de compra ni la vinculación a IDs de producto en código. La estrategia de monetización define los IDs esperados; App Store Connect y RevenueCat deben usar **exactamente** esos mismos strings cuando se restaure o se implemente el SDK.

### 1.3 Estrategia de monetización (documento externo, fuente de verdad de negocio)

| Elemento | Valor declarado |
|----------|-----------------|
| Tipo | Suscripción |
| Product ID mensual | Estrategia: `com.kora.premium.monthly` — confirma el ID **exacto** en ASC al crear el mensual |
| Product ID anual | Estrategia: `com.kora.premium.annual` — **en ASC está creado como** `Koraa_premium_anual` (usar este en RevenueCat) |
| Precios de referencia | $49 MXN / mes; $411 MXN / año; prueba 7 días |
| Entitlement (RevenueCat) | `premium` |
| Offering (RevenueCat) | `default` |
| Paquetes (packages) | `monthly` → producto mensual; `annual` → producto anual |
| Paywall | Soft; disparadores descritos en el documento de estrategia |

### 1.4 Grupos de suscripción en Apple

No se definen en el código. Deben crearse **solo** en App Store Connect y reflejarse en RevenueCat importando los mismos product IDs.

### 1.5 Otros

- **Precios hardcodeados en la app:** no localizados en el escaneo (correcto: el precio lo muestra la tienda / paywall de RevenueCat).
- **Web / Android:** fuera del foco iOS de este documento; si añades `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`, duplica la lógica de productos en Google Play Console con los IDs que uses allí.

---

## 2. Estrategia de grupo de suscripciones (App Store Connect)

### 2.1 Nombre del grupo (configurado en App Store Connect)

**Subscription premium** (como aparece en App Store Connect en tu configuración). Un solo grupo reúne los niveles de acceso premium con los mismos beneficios; solo cambia el periodo de facturación (mensual vs anual).

Lo que importa para RevenueCat y el código es el **ID de producto** exacto de cada suscripción (p. ej. anual `Koraa_premium_anual`), no el nombre del grupo.

### 2.2 Productos incluidos y jerarquía

1. **Nivel de entrada (recomendado como “default” en la ficha):** suscripción **anual** (mejor valor, descuento relativo frente al mensual).
2. **Alternativa:** suscripción **mensual** (misma funcionalidad premium, mayor coste por mes).

Orden sugerido en la página de suscripción de la app (y en el paywall): Anual primero, Mensual segundo.

### 2.3 Texto útil para notas de revisión (App Review)

Puedes pegar una variante breve:

- La app ofrece una suscripción que desbloquea funciones premium: re-planificación ampliada, historial, insights y recomendaciones personalizadas, según la versión en venta. El usuario puede probar antes de pagar si configuras prueba gratuita u oferta introductoria en App Store Connect. Las compras se procesan con Apple; la restauración debe probarse con una cuenta sandbox.

Ajusta el texto a lo que realmente incluya el binario que envíes.

---

## 3. Especificaciones de producto de suscripción

Tabla alineada a la estrategia de monetización. Los nombres “cara a Apple” son sugerencias; Apple valida que sean claros y no engañosos.

### 3.1 Producto mensual

| Campo | Valor recomendado |
|-------|-------------------|
| ID de producto | `com.kora.premium.monthly` |
| Nombre de referencia (interno) | `Koraa_premium_mensual` (sugerido para alinearlo con el anual; si ya usaste otro nombre, documéntalo aquí) |
| Nombre para mostrar (App Store) | Koraa Premium (1 mes) |
| Duración | 1 mes |
| Nivel de precio (base) | Equiv. aprox. a **$49 MXN/mes** en México; en ASC elige el **nivel de precio** de la matriz de Apple que se acerque (el importe final lo fija Apple según impuestos y tipo de cambio) |
| Prueba gratuita | **7 días** (según estrategia; habilitar en ASC bajo la suscripción) |
| Oferta introductoria adicional | Opcional; si usas solo prueba gratuita, deja introductoria vacía o no la solapes mal con la prueba |
| Compartir en familia | Recomendado: **Sí**, salvo decisión de producto en contra (misma regla para todo el grupo suele ser coherente) |
| Estado aprobado para venta | Tras revisión de Apple: **Sí** (hasta entonces no podrás cobrar en producción) |
| Coincidencia RevenueCat | En el dashboard: producto importado con **el mismo ID**; asociado al entitlement `premium` |

### 3.2 Producto anual (configurado en App Store Connect)

| Campo | Valor en App Store Connect |
|-------|----------------------------|
| Nombre de referencia (interno) | `Koraa_premium_anual` |
| ID de producto | **`Koraa_premium_anual`** (es también el identificador de la suscripción en la tienda) |
| Apple ID (interno Apple) | `6764197649` |
| Grupo de suscripción | Subscription premium |
| Duración | **1 año** (correcto para el plan anual) |
| Nombre para mostrar (App Store) | Completar en localizaciones hasta quitar “Faltan metadatos” |
| Nivel de precio (base) | Equiv. aprox. a **$411 MXN/año**; elige el nivel en la matriz de Apple |
| Prueba gratuita | **7 días** (según estrategia; configurar en ASC) |
| Compartir en familia | Opcional: **Activar** en familia si quieres el beneficio; coherente con el mensual |
| Estado | Completar metadatos y precios; objetivo: aprobado para venta |
| Coincidencia RevenueCat | **Importar** el producto con ID **`Koraa_premium_anual`**; vincular al entitlement `premium` y al paquete anual del offering (p. ej. `annual` en `default`) |

### 3.3 Inconsistencias detectadas y correcciones sugeridas

| Tema | Problema | Acción recomendada |
|------|----------|-------------------|
| Anual: ID real vs estrategia | En ASC el anual es `Koraa_premium_anual`, no `com.kora.premium.annual` | En **RevenueCat y código** usa **`Koraa_premium_anual`**. Actualiza el documento de estrategia de monetización para no mezclar dos IDs. |
| Mensual | Aún con ID de documento o por crear | Cuando crees el mensual en ASC, anota su **ID de producto** exacto aquí y en RC (si repites el estilo, podría ser p. ej. `Koraa_premium_mensual`, pero solo si así lo define Apple). |
| Prefijo `com.kora.*` | Ya no aplica al anual tal cual | No borres el anual en ASC por esto: alinea servicios a los IDs existentes. |
| Código vs documento | No hay `productIdentifier` en el repo | Al implementar el SDK, evita duplicar IDs en muchos archivos: un solo módulo `config/subscriptions.ts` con constantes que copien los IDs de ASC. |
| `app.config.js` | No expone claves RevenueCat en `extra` en el escaneo actual | Añade `revenueCatApiKeyIOS` (o `EXPO_PUBLIC_…`) cuando conectes el SDK, y variables en EAS para builds. |
| Entitlement en código | Ausente | Define `ENTITLEMENT_ID = 'premium'` y comprueba `customerInfo.entitlements.active['premium']` al integrar RevenueCat. |

---

## 4. Configuración de precios y disponibilidad

### 4.1 País base y nivel

| Configuración | Valor sugerido |
|---------------|----------------|
| País o región base | **México** (si tu mercado principal es MXN como en la estrategia) |
| Nivel de precio | El de la matriz de Apple que aproxime $49 / $411 MXN (revisar en ASC al publicar) |
| Disponibilidad global | Típico: **Sí** (170+ tiendas) salvo restricción de negocio o legal |
| Fecha de inicio de venta | Fecha en que el producto pase a disponible y el binario esté aprobado |
| Fecha de finalización | En suscripciones auto-renovables normalmente **sin fin**; promociones puntuales se configuran aparte |
| Sobrescrituras por país | Opcional; solo si quieres distintos precios por región |

### 4.2 Resumen

No hay lógica de precio de respaldo en el repositorio. El usuario ve precios de Apple y, en paywall nativo de RevenueCat, lo que devuelva la tienda. Mantén estrategia y ASC sincronizados cuando cambies precios o niveles.

---

## 5. Reporte de consistencia RevenueCat ↔ App Store

| Comprobación | Estado esperado |
|--------------|-----------------|
| ID mensual | El que figure en ASC al crearlo; idéntico en RevenueCat y en código |
| ID **`Koraa_premium_anual`** | Confirmado en ASC (anual, 1 año); idéntico en RevenueCat y en código |
| Entitlement `premium` | Productos de suscripción vinculados a ese entitlement en RC |
| Offering `default` | Paquetes `monthly` / `annual` apuntando a los **IDs reales** de ASC |
| App en RevenueCat | Bundle ID = `com.impermanencecasaartisitca.koraav1` (debe coincidir con el binario) |
| Clave pública iOS (SDK) | Configurada en EAS/entorno de build; no en repositorio público sin cuidado |
| Prueba de 7 días | Misma condición en ASC para ambos productos, coherente con el mensaje de marketing |

**Parches de código a futuro (cuando exista `lib/revenuecat` o similar):**

1. Añadir en un solo fichero, por ejemplo `config/revenuecat.ts`, las constantes `ENTITLEMENT_ID = 'premium'` y `PRODUCT_ID_ANNUAL_IOS = 'Koraa_premium_anual'` (y el mensual cuando exista), alineadas a ASC.
2. Tras `Purchases.logIn` con el id de usuario de Supabase, llamar a `getCustomerInfo` y comprobar `entitlements.active['premium']`.
3. No emparellar el acceso premium solo a tablas propias salvo tengas webhook; la fuente de verdad de cobro es Apple + RevenueCat.

---

## 6. Hoja de ayuda para copiar y pegar (App Store Connect)

### 6.1 Grupo de suscripciones (resumen)

| Campo en ASC | Valor a pegar / criterio |
|--------------|---------------------------|
| Nombre del grupo | Subscription premium |
| Tipo de suscripción | Auto-renovable |
| Productos en el grupo | Anual: `Koraa_premium_anual`. Mensual: (crear y anotar ID exacto al darlo de alta) |

### 6.2 Suscripciones: producto 1 (mensual)

| Campo | Valor a pegar |
|-------|----------------|
| Nombre de referencia | `Koraa_premium_mensual` (sugerido) o el que hayas guardado en ASC |
| ID de producto | `com.kora.premium.monthly` |
| Duración | 1 mes |
| Nivel de precio | (Seleccionar en matriz: aprox. 49 MXN) |
| Compartir en familia | Sí (recomendado) |
| Prueba gratuita | 7 días |
| Oferta introductoria | (Opcional; o ninguna si solo usas prueba) |
| Aprobado para la venta | Sí, cuando Apple lo marque |

### 6.3 Suscripciones: producto 2 (anual)

| Campo | Valor a pegar |
|-------|----------------|
| Nombre de referencia | `Koraa_premium_anual` |
| ID de producto | **`Koraa_premium_anual`** |
| Apple ID (producto) | `6764197649` |
| Duración | 1 año |
| Nivel de precio | (Seleccionar en matriz: aprox. 411 MXN) |
| Compartir en familia | Sí (recomendado) |
| Prueba gratuita | 7 días |
| Oferta introductoria | (Opcional) |
| Aprobado para la venta | Sí, cuando Apple lo marque |

### 6.4 Precios y disponibilidad

| Configuración | Valor |
|---------------|-------|
| País base | México (si aplica) |
| Nivel de precio | Según matriz para cada producto |
| Disponibilidad en tiendas | Sí, salvo exclusión expresa |
| Aprobado para la venta | Sí, tras aprobación |
| Fecha de inicio de disponibilidad | (La que definas al activar oferta) |
| Fecha de finalización | (Vacío o N/A en suscripciones estándar) |

### 6.5 RevenueCat (espejo manual)

| Campo en RevenueCat | Valor |
|----------------------|-------|
| Proyecto / app iOS | Mismo bundle que `app.config.js` |
| Entitlement | `premium` |
| Productos vinculados a `premium` | Anual: **`Koraa_premium_anual`**. Mensual: el ID que definas en ASC |
| Offering | `default` con packages `monthly` y `annual` |

---

**Última nota:** cuando restaures la capa de compra en el repositorio, vuelve a ejecutar búsquedas de `getOfferings`, `entitlements` y `Paywall` y actualiza la sección 1 de este documento para dejar de marcarse como “no implementado”.

*Documento generado para apoyo a implementación; revisar cifras y nombres en App Store Connect al momento de publicar.*

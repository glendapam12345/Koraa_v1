# 🚀 Despliegue Rápido de Koraa

## 📱 MÓVIL: Publicar en Expo Go (Más Rápido)

### Paso 1: Configura EAS (Solo Primera Vez)

```bash
# Instala EAS CLI globalmente
npm install -g eas-cli

# Login a Expo
eas login

# Configura EAS Update en tu proyecto
eas update:configure
```

### Paso 2: Publica tus Cambios

Cada vez que hagas cambios y quieras que se reflejen en el link de Expo Go:

```bash
# Opción 1: Comando rápido
npm run publish

# Opción 2: Con mensaje descriptivo
eas update --branch production --message "Descripción de cambios"
```

### Paso 3: Ver los Cambios

1. **Cierra completamente** la app en Expo Go (no solo minimizar)
2. **Vuelve a abrir** el link o escanea el QR
3. La app descargará automáticamente la nueva versión
4. ¡Listo!

### Comandos Útiles

```bash
# Ver lista de publicaciones
eas update:list --branch production

# Ver detalles de una publicación
eas update:view [update-id]

# Publicar en branch de prueba
eas update --branch preview --message "Testing"
```

### ⚠️ Solución de Problemas Móvil

**Los cambios no se reflejan:**
- Cierra COMPLETAMENTE la app (no solo minimizar)
- Vuelve a escanear el QR desde cero
- Verifica que la publicación fue exitosa (sin errores en terminal)

**"Not logged in":**
```bash
eas login
```

**"No distribution found":**
```bash
eas build --platform android --profile preview
```

---

## 🌐 WEB: Vercel (5 minutos) ⚡

### Opción A: Desde la terminal

1. **Instala Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Despliega**:
   ```bash
   vercel
   ```

3. **Sigue los prompts**:
   - Login con GitHub/Email
   - Confirma el proyecto
   - Acepta configuración por defecto

4. **Configura variables de entorno**:
   - Ve a tu dashboard de Vercel
   - Settings → Environment Variables
   - Agrega:
     - `EXPO_PUBLIC_SUPABASE_URL`
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

5. **Redespliega** para aplicar variables:
   ```bash
   vercel --prod
   ```

### Opción B: Desde la web (más fácil)

1. **Ve a [vercel.com](https://vercel.com)**

2. **Click en "Add New Project"**

3. **Conecta tu repositorio de GitHub**
   - Si no tienes el proyecto en GitHub:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin tu-repositorio-url
     git push -u origin main
     ```

4. **Configura el proyecto en Vercel**:
   - Framework Preset: Other
   - Build Command: `npm run build:web`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Agrega Environment Variables**:
   - `EXPO_PUBLIC_SUPABASE_URL` = tu URL de Supabase
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = tu anon key de Supabase

6. **Click "Deploy"**

✅ Tu app estará live en ~2 minutos en `https://tu-proyecto.vercel.app`

---

## Método 2: Netlify (alternativa)

1. **Ve a [netlify.com](https://netlify.com)**

2. **"Add new site" → "Import an existing project"**

3. **Conecta GitHub**

4. **Configuración**:
   - Build command: `npm run build:web`
   - Publish directory: `dist`

5. **Environment variables** (Site settings → Environment):
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

6. **Deploy site**

---

## Método 3: Render

1. **Ve a [render.com](https://render.com)**

2. **"New" → "Static Site"**

3. **Conecta repositorio**

4. **Configuración**:
   - Build Command: `npm run build:web`
   - Publish Directory: `dist`

5. **Environment variables**:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## ⚙️ Variables de Entorno Necesarias

Obtén estos valores de tu proyecto Supabase:

1. Ve a [app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto
3. Settings → API

**Variables requeridas**:
```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aquí
```

---

## 🔍 Verificación Post-Despliegue

Una vez desplegado, verifica:

- [ ] La app carga correctamente
- [ ] Puedes crear una cuenta nueva
- [ ] Login funciona
- [ ] Check-in diario se guarda
- [ ] Puedes crear tareas
- [ ] Las subtareas se expanden/colapsan
- [ ] La gráfica muestra datos correctos

---

## 🐛 Troubleshooting

### "Can't connect to Supabase"
- Verifica que las variables de entorno estén configuradas
- Asegúrate de incluir el prefijo `EXPO_PUBLIC_`
- Redespliega después de agregar variables

### "Page not found" en rutas
- Asegúrate de tener el `vercel.json` configurado
- Para Netlify, crea `_redirects`:
  ```
  /*    /index.html   200
  ```

### Build falla
- Verifica que `npm run build:web` funcione localmente
- Revisa los logs del build en el dashboard
- Asegúrate de que todas las dependencias estén en `package.json`

---

## 📱 Siguientes Pasos

Una vez que la versión web esté funcionando:

1. **Dominio personalizado**:
   - Vercel: Settings → Domains
   - Agrega tu dominio
   - Configura DNS

2. **Analytics** (opcional):
   - Vercel Analytics (built-in)
   - Google Analytics
   - Plausible (privacy-friendly)

3. **Builds móviles**:
   ```bash
   npm i -g eas-cli
   eas build --platform ios
   eas build --platform android
   ```

---

## 🎉 ¡Listo!

Tu app Koraa está ahora accesible públicamente. Comparte el link y comienza a recibir feedback de usuarios.

**Próximos pasos sugeridos**:
- Configura dominio personalizado
- Habilita analytics
- Prepara builds móviles
- Submit a App Store / Play Store

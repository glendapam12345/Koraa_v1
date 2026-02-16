# Puerto 8081 ocupado: cómo liberarlo

Cuando Expo dice que el puerto 8081 ya está en uso, algo (otro Expo, Metro, o proceso anterior) lo está usando. Así lo liberas para usar `npm run dev` en 8081.

---

## 1. Ver qué está usando el 8081

En la terminal (Mac/Linux):

```bash
lsof -i :8081
```

Verás algo como:

```
COMMAND   PID   USER   FD   TYPE  DEVICE  SIZE/OFF  NODE NAME
node    12345  tu_user  23u  IPv4  ...      0t0  TCP *:8081 (LISTEN)
```

Anota el **PID** (el número, ej. 12345).

---

## 2. Cerrar ese proceso

**Opción A – matar solo ese proceso:**

```bash
kill -9 PID
```

(Reemplaza `PID` por el número que viste, ej. `kill -9 12345`.)

**Opción B – matar todo lo que use el 8081 de un golpe:**

```bash
kill -9 $(lsof -t -i :8081)
```

---

## 3. Comprobar que el puerto está libre

```bash
lsof -i :8081
```

No debería mostrar nada. Si la terminal no imprime ninguna línea, el puerto está libre.

---

## 4. Arrancar Expo de nuevo

```bash
npm run dev
```

Debería iniciar en `exp://...:8081` sin el mensaje de “puerto en uso”.

---

## Si no quieres matar procesos

- Cierra **todas las terminales** donde hayas corrido `npm run dev` o `expo start` (Ctrl+C o cerrar la pestaña).
- Cierra Cursor/VS Code y vuelve a abrirlo (a veces queda un proceso de Metro en segundo plano).
- Reinicia el Mac si sospechas que algo sigue colgado.

---

**Última actualización:** febrero 2026

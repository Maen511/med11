# DermaCure Storefront

## Project info

**DermaCure** - Cosmetic pharmaceutical skincare storefront

## معلومات المشروع

**DermaCure** - متجر أدوية تجميلية للعناية بالبشرة

## Admin login / دخول الأدمن

1. Open `/login` (or use the **Admin** tab on the login page).
2. Default credentials (unless overridden in `.env`):
   - **Username:** `Sadmin` (or email `admin@company.com`)
   - **Password:** `111`
3. After sign-in you are redirected to `/admin`.

To change credentials, set `VITE_ADMIN_USERNAME`, `VITE_ADMIN_EMAIL`, and `VITE_ADMIN_PASSWORD` in `.env`.

---

## أوامر التحقق

```sh
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run build       # Production build
npm run dev         # Dev server
```

---

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

---

## كيفية تعديل الكود؟

هناك عدة طرق لتعديل التطبيق.

**استخدم IDE المفضل لديك**

إذا كنت تريد العمل محلياً باستخدام IDE الخاص بك، يمكنك استنساخ المستودع ورفع التغييرات.

المتطلب الوحيد هو تثبيت Node.js & npm - [تثبيت باستخدام nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

اتبع هذه الخطوات:

```sh
# الخطوة 1: استنساخ المستودع باستخدام رابط Git.
git clone <YOUR_GIT_URL>

# الخطوة 2: الانتقال إلى مجلد المشروع.
cd <YOUR_PROJECT_NAME>

# الخطوة 3: تثبيت التبعيات المطلوبة.
npm i

# الخطوة 4: بدء خادم التطوير مع إعادة التحميل التلقائي والمعاينة الفورية.
npm run dev
```

---

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## ما هي التقنيات المستخدمة في هذا المشروع؟

تم بناء هذا المشروع باستخدام:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

---

## How can I deploy this project?

You can deploy this project using any hosting service like:

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Or any other hosting provider of your choice

## كيف يمكن نشر هذا المشروع؟

يمكنك نشر هذا المشروع باستخدام أي خدمة استضافة مثل:

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- أو أي مزود استضافة آخر تختاره

---

## Can I connect a custom domain to my project?

Yes, you can!

To connect a domain, you'll need to configure it with your hosting provider. Most hosting services provide detailed instructions for custom domain setup.

## هل يمكنني ربط نطاق مخصص بمشروعي؟

نعم، يمكنك!

لربط النطاق، ستحتاج إلى تكوينه مع مزود الاستضافة الخاص بك. معظم خدمات الاستضافة توفر تعليمات مفصلة لإعداد النطاق المخصص.

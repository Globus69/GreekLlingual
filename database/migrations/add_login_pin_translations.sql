-- Add login_pin translations for all 4 languages
-- These keys are used in /app/login-pin/page.tsx

-- English
INSERT INTO ui_translations (key, locale, value) VALUES
('login_pin.title', 'en', 'PIN Login'),
('login_pin.subtitle', 'en', 'Enter your 4-digit PIN'),
('login_pin.admin_button', 'en', 'Admin'),
('login_pin.user_button', 'en', 'User')
ON CONFLICT (key, locale) DO UPDATE SET value = EXCLUDED.value;

-- Russian
INSERT INTO ui_translations (key, locale, value) VALUES
('login_pin.title', 'ru', 'PIN-Вход'),
('login_pin.subtitle', 'ru', 'Введите 4-значный PIN'),
('login_pin.admin_button', 'ru', 'Администратор'),
('login_pin.user_button', 'ru', 'Пользователь')
ON CONFLICT (key, locale) DO UPDATE SET value = EXCLUDED.value;

-- Greek
INSERT INTO ui_translations (key, locale, value) VALUES
('login_pin.title', 'el', 'Σύνδεση PIN'),
('login_pin.subtitle', 'el', 'Εισάγετε τον 4ψήφιο PIN σας'),
('login_pin.admin_button', 'el', 'Διαχειριστής'),
('login_pin.user_button', 'el', 'Χρήστης')
ON CONFLICT (key, locale) DO UPDATE SET value = EXCLUDED.value;

-- German
INSERT INTO ui_translations (key, locale, value) VALUES
('login_pin.title', 'de', 'PIN-Anmeldung'),
('login_pin.subtitle', 'de', 'Geben Sie Ihre 4-stellige PIN ein'),
('login_pin.admin_button', 'de', 'Administrator'),
('login_pin.user_button', 'de', 'Benutzer')
ON CONFLICT (key, locale) DO UPDATE SET value = EXCLUDED.value;

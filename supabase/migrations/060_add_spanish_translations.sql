-- ╔════════════════════════════════════════════════════════════╗
-- ║  Spanish (ES) UI Translations for GreekLingua Dashboard  ║
-- ║  Inserts ~130 Spanish translations into ui_translations  ║
-- ║  Run this in Supabase SQL Editor after main bootstrap    ║
-- ╚════════════════════════════════════════════════════════════╝

-- Extend CHECK constraints to include 'es'
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop existing CHECK constraint on ui_translations.lang
  FOR r IN (SELECT conname FROM pg_constraint WHERE conrelid = 'public.ui_translations'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%lang%') LOOP
    EXECUTE 'ALTER TABLE public.ui_translations DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;

  -- Add new CHECK constraint with 5 languages
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ui_translations_lang_check' AND conrelid = 'public.ui_translations'::regclass) THEN
    ALTER TABLE public.ui_translations ADD CONSTRAINT ui_translations_lang_check CHECK (lang IN ('en', 'ru', 'el', 'de', 'es'));
  END IF;

  -- Drop existing CHECK constraint on users.preferred_locale
  FOR r IN (SELECT conname FROM pg_constraint WHERE conrelid = 'public.users'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%preferred_locale%') LOOP
    EXECUTE 'ALTER TABLE public.users DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;

  -- Add new CHECK constraint with 5 languages
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_preferred_locale_check' AND conrelid = 'public.users'::regclass) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_preferred_locale_check CHECK (preferred_locale IN ('en', 'ru', 'el', 'de', 'es'));
  END IF;
END $$;

-- Update update_user_locale RPC to accept 'es'
CREATE OR REPLACE FUNCTION update_user_locale(p_user_id UUID, p_locale TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_locale NOT IN ('en', 'ru', 'el', 'de', 'es') THEN
    RAISE EXCEPTION 'Invalid locale: %', p_locale;
  END IF;

  UPDATE public.users
  SET preferred_locale = p_locale,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id;
END;
$$;

-- Insert Spanish translations (with ON CONFLICT DO UPDATE for idempotency)
INSERT INTO public.ui_translations (key, lang, value, context) VALUES
-- Header & Auth
('header.logout', 'es', 'Cerrar sesión', 'header'),
('login.title', 'es', 'GreekLingua', 'login'),
('login.subtitle', 'es', 'Ingrese sus datos para continuar aprendiendo', 'login'),
('login.email_placeholder', 'es', 'Nombre de usuario', 'login'),
('login.pin_placeholder', 'es', 'PIN de 6 dígitos', 'login'),
('login.submit', 'es', 'Iniciar sesión', 'login'),
('login.submitting', 'es', 'Iniciando sesión...', 'login'),
('login.error', 'es', 'Usuario o PIN inválido. Inténtelo de nuevo.', 'login'),
('login.biometric', 'es', 'Usar FaceID / TouchID', 'login'),
('login.language_label', 'es', 'Idioma', 'login'),
('login_pin.title', 'es', 'Inicio con PIN', 'login'),
('login_pin.subtitle', 'es', 'Ingrese su PIN de 4 dígitos', 'login'),
('login_pin.admin_button', 'es', 'Administrador', 'login'),
('login_pin.user_button', 'es', 'Usuario', 'login'),

-- Dashboard
('dashboard.authenticating', 'es', 'Autenticando...', 'dashboard'),
('dashboard.loading', 'es', 'Cargando GreekLingua...', 'dashboard'),
('dashboard.welcome', 'es', '¡Bienvenido de nuevo, {name}!', 'dashboard'),
('dashboard.welcome_subtitle', 'es', '¿Listo para continuar tu viaje? Tienes <b>{count} tarjetas de vocabulario nuevas</b> esperando revisión hoy.', 'dashboard'),

-- Stats
('stats.current_level', 'es', 'Nivel actual', 'stats'),
('stats.days', 'es', 'Días', 'stats'),
('stats.vocabs', 'es', 'Vocabulario', 'stats'),
('stats.learned', 'es', 'Aprendidas', 'stats'),
('stats.today', 'es', 'Hoy:', 'stats'),
('stats.daily_goal_default', 'es', '12 vocabularios nuevos y 1 texto corto.', 'stats'),
('stats.hours_suffix', 'es', 'h', 'stats'),

-- Mastery
('mastery.title', 'es', 'Dominio del aprendizaje', 'mastery'),
('mastery.total_time', 'es', 'Tiempo total de aprendizaje: {hours} horas', 'mastery'),
('mastery.last_test', 'es', 'Última prueba', 'mastery'),
('mastery.actual_test', 'es', 'Prueba actual', 'mastery'),
('mastery.last_exam', 'es', 'Último examen', 'mastery'),
('mastery.vocab_progress', 'es', '<b>{learned} / {total}</b> Vocabulario con confianza – {remaining} requieren atención', 'mastery'),
('mastery.suggestion_default', 'es', '12 tarjetas de vocabulario nuevas + 1 texto corto sobre Chipre.', 'mastery'),

-- Actions
('action.magic_round', 'es', 'Tu lección', 'actions'),
('action.quick_lesson', 'es', 'Lección rápida de 20 min', 'actions'),
('action.daily_phrases', 'es', 'Frases diarias', 'actions'),
('action.short_stories', 'es', 'Historias cortas', 'actions'),
('action.train_weak', 'es', 'Entrenar palabras débiles', 'actions'),
('action.review_vocab', 'es', 'Revisar vocabulario', 'actions'),
('action.due_cards', 'es', 'Tarjetas pendientes hoy', 'actions'),
('action.grammar_hits', 'es', 'Gramática rápida', 'actions'),
('action.listening', 'es', 'Práctica de escucha', 'actions'),
('action.pronunciation', 'es', 'Entrenador de pronunciación', 'actions'),
('action.comprehension', 'es', 'Comprensión', 'actions'),
('action.audio_immersion', 'es', 'Inmersión auditiva', 'actions'),
('action.test', 'es', 'Prueba', 'actions'),
('action.cyprus_exam', 'es', 'Simulador de examen de Chipre', 'actions'),
('action.book_recs', 'es', 'Recomendaciones de libros', 'actions'),
('action.progress_history', 'es', 'Historial de progreso', 'actions'),

-- Buttons
('btn.hard', 'es', 'Difícil', 'shared'),
('btn.good', 'es', 'Bien', 'shared'),
('btn.easy', 'es', 'Fácil', 'shared'),
('btn.audio', 'es', 'Audio', 'shared'),
('btn.restart', 'es', 'Reiniciar', 'shared'),
('btn.cancel', 'es', 'Cancelar', 'shared'),
('btn.audio_tooltip', 'es', 'Escuchar pronunciación griega', 'shared'),

-- Flashcard
('flashcard.label_source', 'es', 'ESPAÑOL', 'flashcard'),
('flashcard.label_target', 'es', 'ΕΛΛΗΝΙΚΑ', 'flashcard'),
('flashcard.flip_hint', 'es', 'Haz clic para voltear', 'flashcard'),
('flashcard.tap_hint', 'es', 'Toca la tarjeta para revelar la traducción y luego califica tu desempeño.', 'flashcard'),

-- Vocabulary Dialog
('vocab.loading', 'es', 'Cargando...', 'vocab_dialog'),
('vocab.loading_subtitle', 'es', 'Obteniendo vocabulario de la base de datos...', 'vocab_dialog'),
('vocab.login_required', 'es', 'Inicio de sesión requerido', 'vocab_dialog'),
('vocab.login_required_msg', 'es', 'Por favor inicie sesión para acceder a las funciones de aprendizaje de vocabulario.', 'vocab_dialog'),
('vocab.no_items', 'es', 'No se encontró vocabulario', 'vocab_dialog'),
('vocab.no_items_msg', 'es', 'No hay elementos de vocabulario disponibles para este modo.', 'vocab_dialog'),
('vocab.error', 'es', 'Error', 'vocab_dialog'),
('vocab.error_msg', 'es', 'No se puede cargar la tarjeta de vocabulario.', 'vocab_dialog'),
('vocab.session_complete', 'es', '¡Sesión completa!', 'vocab_dialog'),
('vocab.correct', 'es', 'Correcto', 'vocab_dialog'),
('vocab.wrong', 'es', 'Incorrecto', 'vocab_dialog'),
('vocab.back_to_dashboard', 'es', 'Volver al panel', 'vocab_dialog'),
('vocab.progress_saved', 'es', 'Progreso guardado – ¡bien hecho!', 'vocab_dialog'),
('vocab.result_saved', 'es', 'Resultado guardado – ¡bien hecho!', 'vocab_dialog'),
('vocab.mode.weak_title', 'es', 'Entrenar palabras débiles', 'vocab_dialog'),
('vocab.mode.weak_subtitle', 'es', 'Fortalezcamos estas', 'vocab_dialog'),
('vocab.mode.due_title', 'es', 'Tarjetas pendientes hoy', 'vocab_dialog'),
('vocab.mode.due_subtitle', 'es', 'Tus revisiones diarias', 'vocab_dialog'),
('vocab.mode.review_title', 'es', 'Revisar vocabulario', 'vocab_dialog'),
('vocab.mode.review_subtitle', 'es', 'Refresca tu conocimiento', 'vocab_dialog'),

-- Admin Panel
('header.admin', 'es', 'Administrador', 'header'),
('admin.title', 'es', 'Panel de administración', 'admin'),
('admin.subtitle', 'es', 'Gestión de contenido y estudiantes', 'admin'),
('admin.back_to_dashboard', 'es', 'Volver al panel', 'admin'),
('admin.students', 'es', 'Estudiantes', 'admin'),
('admin.content', 'es', 'Gestión de contenido', 'admin'),
('admin.settings', 'es', 'Configuración', 'admin'),
('admin.total_students', 'es', 'Total de estudiantes', 'admin'),
('admin.active_today', 'es', 'Activos hoy', 'admin'),
('admin.avg_progress', 'es', 'Progreso promedio', 'admin'),
('admin.not_admin', 'es', 'Acceso denegado', 'admin'),
('admin.not_admin_msg', 'es', 'Debe iniciar sesión como administrador para acceder a esta página.', 'admin'),
('admin.go_to_dashboard', 'es', 'Ir al panel', 'admin'),
('admin.students_desc', 'es', 'Gestionar estudiantes, niveles y seguimiento de rendimiento.', 'admin'),
('admin.content_desc', 'es', 'Gestionar elementos de aprendizaje, vocabulario, gramática y ejercicios.', 'admin'),
('admin.settings_desc', 'es', 'Configuración y ajustes de la aplicación.', 'admin'),

-- Student Management
('students.title', 'es', 'Gestión de estudiantes', 'students'),
('students.subtitle', 'es', 'Crear, editar y gestionar estudiantes', 'students'),
('students.add_new', 'es', 'Nuevo estudiante', 'students'),
('students.back_to_list', 'es', 'Volver a la lista', 'students'),
('students.search_placeholder', 'es', 'Buscar por nombre, correo o teléfono...', 'students'),
('students.loading', 'es', 'Cargando estudiantes...', 'students'),
('students.no_students', 'es', 'No se encontraron estudiantes. Haga clic en "Nuevo estudiante" para agregar uno.', 'students'),
('students.form_add_title', 'es', 'Agregar nuevo estudiante', 'students'),
('students.form_edit_title', 'es', 'Editar estudiante', 'students'),
('students.field_name', 'es', 'Nombre', 'students'),
('students.field_email', 'es', 'Correo electrónico', 'students'),
('students.field_whatsapp', 'es', 'WhatsApp', 'students'),
('students.field_pin', 'es', 'PIN (6 dígitos)', 'students'),
('students.field_level', 'es', 'Nivel', 'students'),
('students.field_difficulty', 'es', 'Dificultad', 'students'),
('students.placeholder_name', 'es', 'Nombre completo', 'students'),
('students.placeholder_email', 'es', 'correo@ejemplo.com', 'students'),
('students.placeholder_whatsapp', 'es', '+34 123 456789', 'students'),
('students.pin_optional', 'es', 'dejar vacío para mantener actual', 'students'),
('students.pin_digits', 'es', 'dígitos', 'students'),
('students.diff_easy', 'es', 'Fácil', 'students'),
('students.diff_middle', 'es', 'Medio', 'students'),
('students.diff_hard', 'es', 'Difícil', 'students'),
('students.index_key_label', 'es', 'Índice de rendimiento (auto)', 'students'),
('students.btn_create', 'es', 'Crear estudiante', 'students'),
('students.btn_update', 'es', 'Guardar cambios', 'students'),
('students.saving', 'es', 'Guardando...', 'students'),
('students.saved_success', 'es', '¡Estudiante creado exitosamente!', 'students'),
('students.updated_success', 'es', '¡Estudiante actualizado exitosamente!', 'students'),
('students.deleted_success', 'es', 'Estudiante eliminado.', 'students'),
('students.error_name_required', 'es', 'El nombre es obligatorio.', 'students'),
('students.error_pin_6', 'es', 'El PIN debe tener exactamente 6 dígitos.', 'students'),
('students.error_save', 'es', 'Error al guardar estudiante', 'students'),
('students.error_delete', 'es', 'Error al eliminar estudiante', 'students'),
('students.show_stats', 'es', 'Mostrar progreso', 'students'),
('students.stats_not_available', 'es', 'Estadísticas no disponibles', 'students'),
('students.stats_attempts', 'es', 'Intentos', 'students'),
('students.stats_correct_rate', 'es', 'Tasa de aciertos', 'students'),
('students.stats_items_learned', 'es', 'Aprendidas/Practicadas', 'students'),
('students.stats_last_active', 'es', 'Última actividad', 'students'),
('students.generate_pin', 'es', 'Generar PIN aleatorio', 'students'),

-- Language Switcher
('header.switch_to_ru', 'es', 'Cambiar a ruso', 'header'),
('header.switch_to_en', 'es', 'Cambiar a inglés', 'header'),
('header.switch_to_el', 'es', 'Cambiar a griego', 'header'),
('header.switch_to_de', 'es', 'Cambiar a alemán', 'header'),
('header.switch_to_es', 'es', 'Cambiar a español', 'header'),

-- Lesson Dialog
('lesson.title', 'es', 'Tu lección', 'lesson'),
('lesson.subtitle', 'es', 'Lecciones preparadas por tu profesor', 'lesson'),
('lesson.loading', 'es', 'Cargando...', 'lesson'),
('lesson.loading_subtitle', 'es', 'Cargando tus lecciones...', 'lesson'),
('lesson.no_sessions', 'es', 'Aún no hay lecciones. Tu profesor las agregará para ti.', 'lesson'),
('lesson.back_to_list', 'es', 'Volver', 'lesson'),
('lesson.topic', 'es', 'Tema', 'lesson'),
('lesson.source_language', 'es', 'Traducción', 'lesson'),
('lesson.greek', 'es', 'Griego', 'lesson'),
('lesson.no_vocabulary', 'es', 'No hay vocabulario para esta lección.', 'lesson'),
('lesson.words', 'es', 'palabras', 'lesson'),
('lesson.words_total', 'es', 'palabras en total', 'lesson')
ON CONFLICT (key, lang) DO UPDATE SET
  value = EXCLUDED.value,
  context = EXCLUDED.context,
  created_at = CURRENT_TIMESTAMP;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Spanish (ES) translations inserted/updated successfully!';
END $$;

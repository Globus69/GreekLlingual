-- Migration: 074_brain_gym_translations.sql
-- Description: Add translation keys for Brain Gym (Matching Game)
-- Date: 2026-02-19

-- Update CHECK constraint to include Spanish
DO $$
BEGIN
    ALTER TABLE public.ui_translations DROP CONSTRAINT IF EXISTS ui_translations_lang_check;
    ALTER TABLE public.ui_translations ADD CONSTRAINT ui_translations_lang_check CHECK (lang IN ('en', 'ru', 'el', 'de', 'es'));
    RAISE NOTICE 'CHECK-Constraint ui_translations.lang auf 5 Sprachen erweitert';
END $$;

-- Insert Brain Gym translations (EN)
INSERT INTO ui_translations (key, lang, value) VALUES
('brain_gym.title', 'en', 'Matching'),
('brain_gym.loading', 'en', 'Loading...'),
('brain_gym.card_source', 'en', 'Card Source'),
('brain_gym.due_cards', 'en', 'Due Cards'),
('brain_gym.review_vocab', 'en', 'Review Vocabulary'),
('brain_gym.weak_words', 'en', 'Weak Words'),
('brain_gym.pairs', 'en', 'Pairs'),
('brain_gym.mistakes', 'en', 'Mistakes'),
('brain_gym.time', 'en', 'Time'),
('brain_gym.instructions', 'en', 'Select matching Greek-Translation pairs'),
('brain_gym.greek', 'en', 'Greek'),
('brain_gym.translation', 'en', 'Translation'),
('brain_gym.no_items', 'en', 'No Items Available'),
('brain_gym.no_items_desc', 'en', 'No practice items found.'),
('brain_gym.complete', 'en', 'Game Complete!'),
('brain_gym.score', 'en', 'Score'),
('brain_gym.saving', 'en', 'Saving results...'),
('brain_gym.play_again', 'en', 'Play Again'),
('brain_gym.close', 'en', 'Close')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- Insert Brain Gym translations (RU)
INSERT INTO ui_translations (key, lang, value) VALUES
('brain_gym.title', 'ru', 'Сопоставление'),
('brain_gym.loading', 'ru', 'Загрузка...'),
('brain_gym.card_source', 'ru', 'Источник карт'),
('brain_gym.due_cards', 'ru', 'Карты к повторению'),
('brain_gym.review_vocab', 'ru', 'Повтор словаря'),
('brain_gym.weak_words', 'ru', 'Сложные слова'),
('brain_gym.pairs', 'ru', 'Пары'),
('brain_gym.mistakes', 'ru', 'Ошибки'),
('brain_gym.time', 'ru', 'Время'),
('brain_gym.instructions', 'ru', 'Выберите соответствующие пары греческий-перевод'),
('brain_gym.greek', 'ru', 'Греческий'),
('brain_gym.translation', 'ru', 'Перевод'),
('brain_gym.no_items', 'ru', 'Нет доступных элементов'),
('brain_gym.no_items_desc', 'ru', 'Не найдено элементов для тренировки.'),
('brain_gym.complete', 'ru', 'Игра завершена!'),
('brain_gym.score', 'ru', 'Очки'),
('brain_gym.saving', 'ru', 'Сохранение результатов...'),
('brain_gym.play_again', 'ru', 'Играть снова'),
('brain_gym.close', 'ru', 'Закрыть')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- Insert Brain Gym translations (EL)
INSERT INTO ui_translations (key, lang, value) VALUES
('brain_gym.title', 'el', 'Αντιστοίχιση'),
('brain_gym.loading', 'el', 'Φόρτωση...'),
('brain_gym.card_source', 'el', 'Πηγή Καρτών'),
('brain_gym.due_cards', 'el', 'Καρτες προς Επανάληψη'),
('brain_gym.review_vocab', 'el', 'Επανάληψη Λεξιλογίου'),
('brain_gym.weak_words', 'el', 'Δύσκολες Λέξεις'),
('brain_gym.pairs', 'el', 'Ζευγάρια'),
('brain_gym.mistakes', 'el', 'Λάθη'),
('brain_gym.time', 'el', 'Χρόνος'),
('brain_gym.instructions', 'el', 'Επιλέξτε τα ταιριαστά ζευγάρια ελληνικά-μετάφραση'),
('brain_gym.greek', 'el', 'Ελληνικά'),
('brain_gym.translation', 'el', 'Μετάφραση'),
('brain_gym.no_items', 'el', 'Δεν υπάρχουν διαθέσιμα στοιχεία'),
('brain_gym.no_items_desc', 'el', 'Δεν βρέθηκαν στοιχεία.'),
('brain_gym.complete', 'el', 'Παιχνίδι Ολοκληρώθηκε!'),
('brain_gym.score', 'el', 'Βαθμολογία'),
('brain_gym.saving', 'el', 'Αποθήκευση αποτελεσμάτων...'),
('brain_gym.play_again', 'el', 'Παίξε ξανά'),
('brain_gym.close', 'el', 'Κλείσιμο')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- Insert Brain Gym translations (DE)
INSERT INTO ui_translations (key, lang, value) VALUES
('brain_gym.title', 'de', 'Zuordnung'),
('brain_gym.loading', 'de', 'Lade...'),
('brain_gym.card_source', 'de', 'Kartenquelle'),
('brain_gym.due_cards', 'de', 'Fällige Karten'),
('brain_gym.review_vocab', 'de', 'Vokabeln wiederholen'),
('brain_gym.weak_words', 'de', 'Schwache Wörter'),
('brain_gym.pairs', 'de', 'Paare'),
('brain_gym.mistakes', 'de', 'Fehler'),
('brain_gym.time', 'de', 'Zeit'),
('brain_gym.instructions', 'de', 'Wähle passende Griechisch-Übersetzungs-Paare'),
('brain_gym.greek', 'de', 'Griechisch'),
('brain_gym.translation', 'de', 'Übersetzung'),
('brain_gym.no_items', 'de', 'Keine Elemente verfügbar'),
('brain_gym.no_items_desc', 'de', 'Keine Übungselemente gefunden.'),
('brain_gym.complete', 'de', 'Spiel abgeschlossen!'),
('brain_gym.score', 'de', 'Punktzahl'),
('brain_gym.saving', 'de', 'Speichere Ergebnisse...'),
('brain_gym.play_again', 'de', 'Nochmal spielen'),
('brain_gym.close', 'de', 'Schließen')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- Insert Brain Gym translations (ES)
INSERT INTO ui_translations (key, lang, value) VALUES
('brain_gym.title', 'es', 'Emparejamiento'),
('brain_gym.loading', 'es', 'Cargando...'),
('brain_gym.card_source', 'es', 'Fuente de Tarjetas'),
('brain_gym.due_cards', 'es', 'Tarjetas Pendientes'),
('brain_gym.review_vocab', 'es', 'Repasar Vocabulario'),
('brain_gym.weak_words', 'es', 'Palabras Difíciles'),
('brain_gym.pairs', 'es', 'Pares'),
('brain_gym.mistakes', 'es', 'Errores'),
('brain_gym.time', 'es', 'Tiempo'),
('brain_gym.instructions', 'es', 'Selecciona pares coincidentes griego-traducción'),
('brain_gym.greek', 'es', 'Griego'),
('brain_gym.translation', 'es', 'Traducción'),
('brain_gym.no_items', 'es', 'No hay elementos disponibles'),
('brain_gym.no_items_desc', 'es', 'No se encontraron elementos de práctica.'),
('brain_gym.complete', 'es', '¡Juego Completado!'),
('brain_gym.score', 'es', 'Puntuación'),
('brain_gym.saving', 'es', 'Guardando resultados...'),
('brain_gym.play_again', 'es', 'Jugar de Nuevo'),
('brain_gym.close', 'es', 'Cerrar')
ON CONFLICT (key, lang) DO UPDATE SET value = EXCLUDED.value;

-- Migration 074 completed

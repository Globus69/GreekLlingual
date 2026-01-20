import sys
import random
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QGridLayout, QPushButton, QLabel, QProgressBar, QMessageBox, 
    QScrollArea, QFrame, QGraphicsDropShadowEffect, QStackedWidget,
    QLineEdit, QCheckBox, QComboBox, QGroupBox
)
from PyQt6.QtCore import Qt, QSize, pyqtSignal
from PyQt6.QtGui import QFont, QColor, QCursor

class ModuleTile(QFrame):
    clicked = pyqtSignal(str)
    
    def __init__(self, title, icon_emoji, status="", color="#FFFFFF", parent=None):
        super().__init__(parent)
        self.setFixedSize(120, 120)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setObjectName("ModuleTile")
        self.title = title
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(10, 10, 10, 10)
        layout.setSpacing(5)
        
        # Status Badge (if any)
        if status:
            status_label = QLabel(status)
            status_label.setStyleSheet(f"""
                font-size: 8px; font-weight: 800; color: white; 
                background: #34c759; padding: 2px 4px; border-radius: 6px;
            """)
            status_label.setFixedWidth(40)
            status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            layout.addWidget(status_label, 0, Qt.AlignmentFlag.AlignRight)
        else:
            layout.addSpacing(20)
        
        # Icon
        self.icon_label = QLabel(icon_emoji)
        self.icon_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.icon_label.setStyleSheet("font-size: 32px;")
        
        # Title
        self.title_label = QLabel(title)
        self.title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.title_label.setStyleSheet("font-size: 12px; font-weight: 700; color: #2D2D2D;")
        
        layout.addWidget(self.icon_label)
        layout.addWidget(self.title_label)
        layout.addStretch()
        
        # Shadow
        self.shadow = QGraphicsDropShadowEffect()
        self.shadow.setBlurRadius(20)
        self.shadow.setXOffset(0)
        self.shadow.setYOffset(4)
        self.shadow.setColor(QColor(0, 0, 0, 30))
        self.setGraphicsEffect(self.shadow)
        
        self.setStyleSheet(f"""
            #ModuleTile {{
                background-color: {color};
                border: 1px solid #E0E0E0;
                border-radius: 24px;
            }}
            #ModuleTile:hover {{
                background-color: #F8F9FA;
                border: 1px solid #4A90E2;
            }}
        """)

    def mousePressEvent(self, event):
        self.clicked.emit(self.title)
        super().mousePressEvent(event)

class IntroHeader(QLabel):
    def __init__(self):
        super().__init__("Note: This is a rough example layout.")
        self.setStyleSheet("""
            background: #FFF9C4; color: #F57F17; font-weight: 700; 
            padding: 4px; border-radius: 6px; border: 1px solid #FFEB3B;
            margin-bottom: 10px; font-size: 11px;
        """)
        self.setAlignment(Qt.AlignmentFlag.AlignCenter)

class VokabelnView(QWidget):
    def __init__(self):
        super().__init__()
        
        # macOS 26 background
        self.setStyleSheet("background-color: #1A1A1E;")
        
        # Vocabulary data
        self.vocabulary = [
            {
                "english": "Hello",
                "greek": "Γεια σου",
                "example_en": "Hello, how are you?",
                "example_gr": "Γεια σου, πώς είσαι;"
            },
            {
                "english": "Thank you",
                "greek": "Ευχαριστώ",
                "example_en": "Thank you very much!",
                "example_gr": "Ευχαριστώ πολύ!"
            },
            {
                "english": "Yes",
                "greek": "Ναι",
                "example_en": "Yes, I agree.",
                "example_gr": "Ναι, συμφωνώ."
            },
            {
                "english": "No",
                "greek": "Όχι",
                "example_en": "No, thank you.",
                "example_gr": "Όχι, ευχαριστώ."
            },
            {
                "english": "Water",
                "greek": "Νερό",
                "example_en": "Can I have some water?",
                "example_gr": "Μπορώ να έχω λίγο νερό;"
            }
        ]
        
        self.current_index = 0
        self.is_flipped = False
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)
        
        # Top bar: Back button + Progress
        top_bar = QWidget()
        top_bar.setStyleSheet("background-color: #1A1A1E;")
        top_layout = QHBoxLayout(top_bar)
        top_layout.setContentsMargins(32, 24, 32, 16)
        
        # Back button
        back_btn = QPushButton("← Dashboard")
        back_btn.setStyleSheet("""
            QPushButton {
                background: transparent;
                border: none;
                color: #007AFF;
                font-size: 16px;
                font-weight: 600;
                padding: 8px 0px;
            }
            QPushButton:hover {
                color: #409CFF;
            }
        """)
        back_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        top_layout.addWidget(back_btn)
        top_layout.addStretch()
        
        # Progress text
        self.progress_text = QLabel(f"{self.current_index + 1} von {len(self.vocabulary)}")
        self.progress_text.setStyleSheet("""
            font-size: 14px;
            font-weight: 500;
            color: #A0A0A5;
        """)
        top_layout.addWidget(self.progress_text)
        
        layout.addWidget(top_bar)
        
        # Main content
        content = QWidget()
        content.setStyleSheet("background-color: #1A1A1E;")
        content_layout = QVBoxLayout(content)
        content_layout.setContentsMargins(40, 100, 40, 60)
        
        # Flashcard
        card_container = QWidget()
        card_layout = QVBoxLayout(card_container)
        card_layout.setContentsMargins(0, 0, 0, 0)
        
        self.card = QFrame()
        self.card.setFixedSize(600, 400)
        self.card.setStyleSheet("""
            QFrame {
                background-color: #242424;
                border-radius: 28px;
            }
        """)
        
        # Card shadow
        shadow = QGraphicsDropShadowEffect()
        shadow.setBlurRadius(12)
        shadow.setXOffset(0)
        shadow.setYOffset(6)
        shadow.setColor(QColor(0, 0, 0, 76))  # opacity 0.3
        self.card.setGraphicsEffect(shadow)
        
        self.card_content = QVBoxLayout(self.card)
        self.card_content.setContentsMargins(48, 48, 48, 48)
        self.card_content.setSpacing(24)
        
        # Language label (uppercase, small)
        self.lang_label = QLabel("ENGLISH")
        self.lang_label.setStyleSheet("""
            font-size: 14px;
            font-weight: 600;
            color: #A0A0A5;
            letter-spacing: 2px;
        """)
        self.lang_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.card_content.addWidget(self.lang_label)
        
        self.card_content.addStretch()
        
        # Main word (72pt, bold, white)
        self.word_label = QLabel("Hello")
        self.word_label.setStyleSheet("""
            font-size: 72px;
            font-weight: 700;
            color: #EDEDED;
            letter-spacing: -2px;
        """)
        self.word_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.word_label.setWordWrap(True)
        self.card_content.addWidget(self.word_label)
        
        # Example sentence (18pt, italic, gray)
        self.example_label = QLabel("Hello, how are you?")
        self.example_label.setStyleSheet("""
            font-size: 18px;
            color: #A0A0A5;
            font-style: italic;
            font-weight: 400;
        """)
        self.example_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.example_label.setWordWrap(True)
        self.card_content.addWidget(self.example_label)
        
        self.card_content.addStretch()
        
        # Make card clickable
        self.card.mousePressEvent = self.flip_card
        self.card.setCursor(Qt.CursorShape.PointingHandCursor)
        
        card_layout.addWidget(self.card, 0, Qt.AlignmentFlag.AlignCenter)
        content_layout.addWidget(card_container)
        content_layout.addStretch()
        
        layout.addWidget(content)
        
        # Bottom navigation bar
        nav_bar = QWidget()
        nav_bar.setStyleSheet("background-color: #1A1A1E;")
        nav_layout = QHBoxLayout(nav_bar)
        nav_layout.setContentsMargins(40, 24, 40, 36)
        nav_layout.setSpacing(20)
        
        # Previous button (outline, with icon)
        self.prev_btn = QPushButton("← Previous")
        self.prev_btn.setFixedHeight(50)
        self.prev_btn.setStyleSheet("""
            QPushButton {
                background: transparent;
                border: 1.5px solid #3A3A3C;
                border-radius: 14px;
                font-weight: 600;
                font-size: 16px;
                color: #EDEDED;
                padding: 0 36px;
            }
            QPushButton:hover {
                border-color: #007AFF;
                color: #007AFF;
            }
            QPushButton:pressed {
                background: rgba(0, 122, 255, 0.1);
            }
            QPushButton:disabled {
                border-color: #2C2C2E;
                color: #636366;
            }
        """)
        self.prev_btn.clicked.connect(self.previous_card)
        nav_layout.addWidget(self.prev_btn)
        
        # Flip button (filled, prominent, radius 16px)
        flip_btn = QPushButton("Flip Card")
        flip_btn.setFixedHeight(56)
        flip_btn.setStyleSheet("""
            QPushButton {
                background: #007AFF;
                border: none;
                border-radius: 16px;
                font-weight: 700;
                font-size: 18px;
                color: white;
                padding: 0 56px;
            }
            QPushButton:hover {
                background: #409CFF;
            }
            QPushButton:pressed {
                background: #0066CC;
            }
        """)
        flip_btn.clicked.connect(self.flip_card)
        
        flip_shadow = QGraphicsDropShadowEffect()
        flip_shadow.setBlurRadius(24)
        flip_shadow.setXOffset(0)
        flip_shadow.setYOffset(6)
        flip_shadow.setColor(QColor(0, 122, 255, 60))
        flip_btn.setGraphicsEffect(flip_shadow)
        
        nav_layout.addWidget(flip_btn, 1)
        
        # Next button (outline, with icon)
        self.next_btn = QPushButton("Next →")
        self.next_btn.setFixedHeight(50)
        self.next_btn.setStyleSheet("""
            QPushButton {
                background: transparent;
                border: 1.5px solid #3A3A3C;
                border-radius: 14px;
                font-weight: 600;
                font-size: 16px;
                color: #EDEDED;
                padding: 0 36px;
            }
            QPushButton:hover {
                border-color: #007AFF;
                color: #007AFF;
            }
            QPushButton:pressed {
                background: rgba(0, 122, 255, 0.1);
            }
            QPushButton:disabled {
                border-color: #2C2C2E;
                color: #636366;
            }
        """)
        self.next_btn.clicked.connect(self.next_card)
        nav_layout.addWidget(self.next_btn)
        
        layout.addWidget(nav_bar)
        
        # Initialize
        self.update_card()
        self.update_navigation_buttons()
    
    def update_card(self):
        """Update card content"""
        vocab = self.vocabulary[self.current_index]
        
        if not self.is_flipped:
            # Front (English)
            self.lang_label.setText("ENGLISH")
            self.word_label.setText(vocab["english"])
            self.word_label.setStyleSheet("""
                font-size: 72px;
                font-weight: 700;
                color: #EDEDED;
                letter-spacing: -2px;
            """)
            self.example_label.setText(vocab["example_en"])
        else:
            # Back (Greek)
            self.lang_label.setText("ΕΛΛΗΝΙΚΑ")
            self.word_label.setText(vocab["greek"])
            self.word_label.setStyleSheet("""
                font-size: 72px;
                font-weight: 700;
                color: #007AFF;
                letter-spacing: -2px;
            """)
            self.example_label.setText(vocab["example_gr"])
        
        # Update progress
        self.progress_text.setText(f"{self.current_index + 1} von {len(self.vocabulary)}")
    
    def flip_card(self, event=None):
        """Flip the card"""
        self.is_flipped = not self.is_flipped
        self.update_card()
    
    def previous_card(self):
        """Previous card"""
        if self.current_index > 0:
            self.current_index -= 1
            self.is_flipped = False
            self.update_card()
            self.update_navigation_buttons()
    
    def next_card(self):
        """Next card"""
        if self.current_index < len(self.vocabulary) - 1:
            self.current_index += 1
            self.is_flipped = False
            self.update_card()
            self.update_navigation_buttons()
    
    def update_navigation_buttons(self):
        """Enable/disable navigation"""
        self.prev_btn.setEnabled(self.current_index > 0)
        self.next_btn.setEnabled(self.current_index < len(self.vocabulary) - 1)

class PhrasenView(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 10, 25, 25)
        layout.setSpacing(10)
        
        layout.addWidget(IntroHeader())
        
        title = QLabel("Common Phrases")
        title.setStyleSheet("font-size: 18px; font-weight: 800; color: #2D2D2D;")
        layout.addWidget(title)
        
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        content = QWidget()
        c_layout = QVBoxLayout(content)
        c_layout.setSpacing(10)
        
        phrases = [
            ("Good morning", "Καλημέρα (Kaliméra)"),
            ("How are you?", "Πώς είσαι; (Pós íse?)"),
            ("Where is the beach?", "Πού είναι η παραλία; (Poú íne i paralía?)"),
            ("I would like a coffee", "Θα ήθελα έναν καφέ (Tha íthela énan kafé)"),
            ("Can you help me?", "Μπορείτε να με βοηθήσετε; (Boríte na me voithísete?)"),
            ("Check please", "Το λογαριασμό παρακαλώ (To logariasmó parakaló)"),
            ("Excuse me", "Με συγχωρείτε (Me synchoreíte)")
        ]
        
        for eng, gr in phrases:
            p_frame = QFrame()
            p_frame.setStyleSheet("background: white; border-radius: 8px; border: 1px solid #E0E0E0;")
            p_layout = QHBoxLayout(p_frame)
            p_layout.setContentsMargins(10, 8, 10, 8)
            
            e_lbl = QLabel(eng)
            e_lbl.setStyleSheet("font-weight: 600; font-size: 13px;")
            g_lbl = QLabel(gr)
            g_lbl.setStyleSheet("font-size: 13px; color: #4A90E2; font-weight: 700;")
            
            p_layout.addWidget(e_lbl)
            p_layout.addStretch()
            p_layout.addWidget(g_lbl)
            c_layout.addWidget(p_frame)
            
        c_layout.addStretch()
        scroll.setWidget(content)
        layout.addWidget(scroll)

class QuizView(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 10, 25, 25)
        layout.setSpacing(10)
        
        layout.addWidget(IntroHeader())
        
        title = QLabel("Reading Quiz")
        title.setStyleSheet("font-size: 18px; font-weight: 800; color: #2D2D2D;")
        layout.addWidget(title)
        
        # Interactive Text
        text_container = QFrame()
        text_container.setStyleSheet("background: white; border-radius: 15px; border: 1px solid #E0E0E0; padding: 15px;")
        t_layout = QVBoxLayout(text_container)
        
        self.content_lbl = QLabel()
        self.content_lbl.setWordWrap(True)
        self.content_lbl.setStyleSheet("font-size: 14px; color: #2D2D2D; line-height: 1.4;")
        
        # Approximate 100 word Greek text with noun interaction
        # We'll use HTML with <a> tags to simulate links for specific words
        raw_text = """Γεια σας! Σήμερα είναι μια όμορφη <u><a href="day" style="color:red;">μέρα</a></u> στην <u><a href="city" style="color:red;">πόλη</a></u>. 
        Ο <u><a href="sun" style="color:red;">ήλιος</a></u> λάμπει και η <u><a href="sea" style="color:red;">θάλασσα</a></u> είναι πολύ ήρεμη. 
        Πολλοί <u><a href="people" style="color:red;">άνθρωποι</a></u> περπατούν στον <u><a href="road" style="color:red;">δρόμο</a></u> και πηγαίνουν στα <u><a href="shops" style="color:red;">μαγαζιά</a></u>. 
        Το <u><a href="breakfast" style="color:red;">πρωινό</a></u> στο <u><a href="cafe" style="color:red;">καφενείο</a></u> ήταν εξαιρετικό. 
        Έφαγα ένα <u><a href="bread" style="color:red;">ψωμί</a></u> με <u><a href="honey" style="color:red;">μέλι</a></u>. 
        Η <u><a href="life" style="color:red;">ζωή</a></u> είναι ωραία όταν μαθαίνεις μια νέα <u><a href="language" style="color:red;">γλώσσα</a></u>. 
        Το <u><a href="book" style="color:red;">βιβλίο</a></u> μου είναι στην <u><a href="bag" style="color:red;">τσάντα</a></u> μου. 
        Θέλω να αγοράσω ένα <u><a href="gift" style="color:red;">δώρο</a></u> για τον <u><a href="friend" style="color:red;">φίλο</a></u> μου. 
        Το <u><a href="dinner" style="color:red;">δείπνο</a></u> το <u><a href="evening" style="color:red;">βράδυ</a></u> θα είναι στο <u><a href="restaurant" style="color:red;">εστιατόριο</a></u>."""
        
        self.content_lbl.setText(raw_text)
        self.content_lbl.linkActivated.connect(self.show_meaning)
        
        t_layout.addWidget(self.content_lbl)
        layout.addWidget(text_container)
        layout.addStretch()

    def show_meaning(self, link):
        meanings = {
            "day": "Day", "city": "City", "sun": "Sun", "sea": "Sea",
            "people": "People", "road": "Road", "shops": "Shops",
            "breakfast": "Breakfast", "cafe": "Cafe", "bread": "Bread",
            "honey": "Honey", "life": "Life", "language": "Language",
            "book": "Book", "bag": "Bag", "gift": "Gift", "friend": "Friend",
            "dinner": "Dinner", "evening": "Evening", "restaurant": "Restaurant"
        }
        meaning = meanings.get(link, "Unknown")
        QMessageBox.information(self, "Word Meaning", f"Meaning: {meaning}")

class FlashcardView(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 10, 25, 10)
        layout.setSpacing(10)
        
        layout.addWidget(IntroHeader())
        
        # Theme Selection
        theme_layout = QHBoxLayout()
        theme_lbl = QLabel("Focus Theme:")
        theme_lbl.setStyleSheet("font-size: 12px; font-weight: 700;")
        self.theme_sel = QComboBox()
        self.theme_sel.addItems(["All", "Essen gehen", "Reisen", "Büro", "Einkaufen", "Alltag"])
        self.theme_sel.setStyleSheet("padding: 4px; border-radius: 6px; min-width: 150px; font-size: 11px;")
        theme_layout.addWidget(theme_lbl)
        theme_layout.addWidget(self.theme_sel)
        theme_layout.addStretch()
        layout.addLayout(theme_layout)
        
        # Card Container
        self.card = QFrame()
        self.card.setFixedHeight(220)
        self.card.setObjectName("Flashcard")
        self.card.setCursor(Qt.CursorShape.PointingHandCursor)
        self.card_layout = QVBoxLayout(self.card)
        self.card_layout.setContentsMargins(15, 15, 15, 15)
        
        self.flipped = False
        self.update_card_content()
        
        layout.addWidget(self.card)
        layout.addStretch()

    def update_card_content(self):
        for i in reversed(range(self.card_layout.count())): 
            item = self.card_layout.itemAt(i)
            if item.widget():
                item.widget().setParent(None)
            
        if not self.flipped:
            self.card.setStyleSheet("#Flashcard { background: white; border: 1px solid #E0E0E0; border-radius: 16px; }")
            greek_word = QLabel("Το ψωμί")
            greek_word.setStyleSheet("font-size: 36px; font-weight: 800; color: #2D2D2D;")
            self.card_layout.addStretch()
            self.card_layout.addWidget(greek_word, 0, Qt.AlignmentFlag.AlignCenter)
            self.card_layout.addStretch()
        else:
            self.card.setStyleSheet("#Flashcard { background: #4A90E2; border-radius: 16px; color: white; }")
            english_word = QLabel("Bread")
            english_word.setStyleSheet("font-size: 40px; font-weight: 800; color: white;")
            self.card_layout.addStretch()
            self.card_layout.addWidget(english_word, 0, Qt.AlignmentFlag.AlignCenter)
            self.card_layout.addStretch()

    def mousePressEvent(self, event):
        if self.card.underMouse():
            self.flipped = not self.flipped
            self.update_card_content()
        super().mousePressEvent(event)

class StatsView(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 10, 25, 25)
        layout.setSpacing(15)
        layout.addWidget(IntroHeader())
        
        title = QLabel("Performance Hub")
        title.setStyleSheet("font-size: 18px; font-weight: 800; color: #2D2D2D;")
        layout.addWidget(title)
        
        graph_box = QFrame()
        graph_box.setFixedHeight(150)
        graph_box.setStyleSheet("background: white; border: 1px solid #E0E0E0; border-radius: 15px;")
        g_layout = QHBoxLayout(graph_box)
        g_layout.setContentsMargins(15, 40, 15, 10)
        for h in [40, 60, 45, 90, 65, 80, 100]:
            bar = QFrame()
            bar.setStyleSheet("background: #4A90E2; border-radius: 4px;")
            bar.setFixedHeight(int(h * 0.8))
            g_layout.addWidget(bar, 0, Qt.AlignmentFlag.AlignBottom)
        layout.addWidget(graph_box)
        layout.addStretch()

class VideoView(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 10, 25, 25)
        layout.setSpacing(10)
        layout.addWidget(IntroHeader())
        
        title = QLabel("Video Lessons")
        title.setStyleSheet("font-size: 18px; font-weight: 800; color: #2D2D2D;")
        layout.addWidget(title)
        
        # Category Filter
        filter_layout = QHBoxLayout()
        cat_lbl = QLabel("Category:")
        cat_lbl.setStyleSheet("font-size: 11px;")
        filter_layout.addWidget(cat_lbl)
        cat_combo = QComboBox()
        cat_combo.addItems(["All", "Grammar", "Conversational", "Pronunciation", "Culture"])
        cat_combo.setStyleSheet("padding: 4px; border-radius: 6px; min-width: 100px; font-size: 11px;")
        filter_layout.addWidget(cat_combo)
        filter_layout.addStretch()
        layout.addLayout(filter_layout)
        
        # Video Grid (Placeholders)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)
        container = QWidget()
        grid = QGridLayout(container)
        grid.setSpacing(20)
        
        for i in range(6):
            v_tile = QFrame()
            v_tile.setFixedSize(140, 100)
            v_tile.setStyleSheet("background: #000; border-radius: 8px;")
            v_layout = QVBoxLayout(v_tile)
            
            p_icon = QLabel("▶")
            p_icon.setStyleSheet("color: white; font-size: 24px;")
            p_icon.setAlignment(Qt.AlignmentFlag.AlignCenter)
            v_layout.addWidget(p_icon)
            
            v_title = QLabel(f"Lesson {i+1}")
            v_title.setStyleSheet("color: white; font-weight: 600; font-size: 10px;")
            v_layout.addWidget(v_title)
            
            grid.addWidget(v_tile, i // 2, i % 2)
            
        scroll.setWidget(container)
        layout.addWidget(scroll)

class TextView(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 10, 25, 25)
        layout.setSpacing(10)
        layout.addWidget(IntroHeader())
        
        title = QLabel("Reading Materials")
        title.setStyleSheet("font-size: 18px; font-weight: 800; color: #2D2D2D;")
        layout.addWidget(title)
        
        texts = [
            ("The Parthenon", "A historical overview of the iconic temple."),
            ("Greek Coffee Culture", "Why coffee is more than just a drink in Greece."),
            ("Odyssey: Summary", "The epic journey of Odysseus."),
            ("Modern Athens", "Life in the bustling Greek capital today.")
        ]
        
        for t_title, t_desc in texts:
            t_frame = QFrame()
            t_frame.setStyleSheet("background: white; border-radius: 8px; border: 1px solid #E0E0E0;")
            t_layout = QVBoxLayout(t_frame)
            t_layout.setContentsMargins(12, 12, 12, 12)
            
            lbl_title = QLabel(t_title)
            lbl_title.setStyleSheet("font-size: 14px; font-weight: 700; color: #4A90E2;")
            lbl_desc = QLabel(t_desc)
            lbl_desc.setStyleSheet("color: #666; font-size: 11px;")
            
            t_layout.addWidget(lbl_title)
            t_layout.addWidget(lbl_desc)
            
            btn_read = QPushButton("Read Text →")
            btn_read.setStyleSheet("background: #F8F9FA; color: #4A90E2; font-weight: 700; border: none; text-align: left; font-size: 11px;")
            t_layout.addWidget(btn_read)
            
            layout.addWidget(t_frame)
            
        layout.addStretch()

class StoriesView(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 10, 25, 25)
        layout.setSpacing(10)
        layout.addWidget(IntroHeader())
        
        title = QLabel("Short Stories")
        title.setStyleSheet("font-size: 18px; font-weight: 800; color: #2D2D2D;")
        layout.addWidget(title)
        
        # Player Mock
        player = QFrame()
        player.setFixedHeight(150)
        player.setStyleSheet("background: #4A90E2; border-radius: 12px; color: white;")
        p_layout = QVBoxLayout(player)
        p_layout.setContentsMargins(15, 15, 15, 15)
        
        s_title = QLabel("The Brave Little Owl")
        s_title.setStyleSheet("font-size: 14px; font-weight: 800;")
        p_layout.addWidget(s_title)
        
        p_layout.addStretch()
        
        progress = QProgressBar()
        progress.setValue(35)
        progress.setTextVisible(False)
        progress.setStyleSheet("""
            QProgressBar { background: rgba(255,255,255,0.3); border-radius: 3px; height: 6px; }
            QProgressBar::chunk { background: white; border-radius: 3px; }
        """)
        p_layout.addWidget(progress)
        
        ctrl_layout = QHBoxLayout()
        for icon in ["⏮", "⏸", "⏭"]:
            btn = QPushButton(icon)
            btn.setStyleSheet("font-size: 18px; background: transparent; color: white; border: none;")
            ctrl_layout.addWidget(btn)
        p_layout.addLayout(ctrl_layout)
        
        layout.addWidget(player)
        layout.addStretch()

class BooksView(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 10, 25, 25)
        layout.setSpacing(10)
        layout.addWidget(IntroHeader())
        
        title = QLabel("Library")
        title.setStyleSheet("font-size: 18px; font-weight: 800; color: #2D2D2D;")
        layout.addWidget(title)
        
        grid = QGridLayout()
        grid.setSpacing(10)
        
        books = [
            ("Grammar 101", "📗"),
            ("1000 Verbs", "📘"),
            ("Greek Myths", "📙"),
            ("Cooking Terms", "📕")
        ]
        
        for i, (b_name, b_icon) in enumerate(books):
            b_frame = QFrame()
            b_frame.setFixedSize(100, 125)
            b_frame.setStyleSheet("background: white; border-radius: 10px; border: 1px solid #E0E0E0;")
            b_layout = QVBoxLayout(b_frame)
            
            icon = QLabel(b_icon)
            icon.setStyleSheet("font-size: 32px;")
            icon.setAlignment(Qt.AlignmentFlag.AlignCenter)
            b_layout.addWidget(icon)
            
            name = QLabel(b_name)
            name.setStyleSheet("font-weight: 700; font-size: 10px;")
            name.setAlignment(Qt.AlignmentFlag.AlignCenter)
            b_layout.addWidget(name)
            
            grid.addWidget(b_frame, i // 2, i % 2)
            
        layout.addLayout(grid)
        layout.addStretch()

class CyprusExamMainView(QWidget):
    switch_page = pyqtSignal(int)
    
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 10, 25, 10)
        layout.setSpacing(8)
        layout.addWidget(IntroHeader())
        
        title = QLabel("Vorbereitung auf die Zypern-Prüfung")
        title.setStyleSheet("font-size: 16px; font-weight: 800; color: #4A90E2;")
        layout.addWidget(title)
        
        info = QLabel("Für die Aufenthaltsgenehmigung in Zypern ist oft B1-Griechisch und Wissen über die Gesellschaft erforderlich.")
        info.setWordWrap(True)
        info.setStyleSheet("font-size: 11px; color: #666; font-style: italic;")
        layout.addWidget(info)
        
        grid = QGridLayout()
        grid.setSpacing(12)
        
        topics = [
            ("Listening", "🎧"),
            ("Reading", "📖"),
            ("Writing", "✍️"),
            ("Speaking", "🗣️"),
            ("Society Knowledge", "🏛️")
        ]
        
        for i, (name, icon) in enumerate(topics):
            btn = QPushButton(f"{icon} {name}")
            btn.setFixedHeight(45)
            btn.setStyleSheet("""
                QPushButton { 
                    background: white; border: 1px solid #E0E0E0; border-radius: 10px; 
                    font-weight: 700; font-size: 11px; color: #2D2D2D; text-align: left; padding-left: 15px;
                }
                QPushButton:hover { background: #F8F9FA; border-color: #4A90E2; }
            """)
            btn.clicked.connect(lambda checked, n=name: self.handle_click(n))
            grid.addWidget(btn, i // 2, i % 2)
            
        layout.addLayout(grid)
        layout.addStretch()

    def handle_click(self, name):
        if name == "Listening":
            self.switch_page.emit(11)
        else:
            QMessageBox.information(self, "Info", f"An der Funktion '{name}' wird gerade entwickelt.")

class CyprusListeningView(QWidget):
    back_to_main = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(25, 10, 25, 10)
        layout.setSpacing(10)
        layout.addWidget(IntroHeader())
        
        header = QHBoxLayout()
        title = QLabel("Beispiele für Listening")
        title.setStyleSheet("font-size: 16px; font-weight: 800; color: #2D2D2D;")
        back_btn = QPushButton("← Zurück")
        back_btn.setStyleSheet("background: transparent; color: #4A90E2; font-weight: 700; border: none; font-size: 12px;")
        back_btn.clicked.connect(lambda: self.back_to_main.emit())
        header.addWidget(title)
        header.addStretch()
        header.addWidget(back_btn)
        layout.addLayout(header)
        
        # Examples List
        examples = [
            ("Hello", "Γεια σου"),
            ("Thank you", "Ευχαριστώ"),
            ("Cyprus", "Κύπρος")
        ]
        
        for eng, el in examples:
            card = QFrame()
            card.setStyleSheet("background: white; border: 1px solid #E0E0E0; border-radius: 8px;")
            card.setFixedHeight(60)
            c_layout = QHBoxLayout(card)
            
            text_box = QVBoxLayout()
            l_eng = QLabel(f"<b>{eng}</b>")
            l_eng.setStyleSheet("font-size: 12px;")
            l_el = QLabel(el)
            l_el.setStyleSheet("color: #4A90E2; font-size: 13px;")
            text_box.addWidget(l_eng)
            text_box.addWidget(l_el)
            
            p_btn = QPushButton("▶ Abspielen")
            p_btn.setFixedWidth(100)
            p_btn.setStyleSheet("""
                QPushButton { background: #F0F4F8; color: #4A90E2; border-radius: 6px; font-size: 10px; font-weight: 700; }
                QPushButton:hover { background: #E1E9F1; }
            """)
            p_btn.clicked.connect(lambda: QMessageBox.information(self, "Audio", "Audio wird entwickelt"))
            
            c_layout.addLayout(text_box)
            c_layout.addStretch()
            c_layout.addWidget(p_btn)
            layout.addWidget(card)
            
        layout.addStretch()

class DashboardStats(QFrame):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QFrame { 
                background: white; 
                border: 1px solid #E0E0E0; 
                border-radius: 12px; 
            }
            QLabel { border: none; font-size: 11px; font-weight: 600; color: #444; }
            QProgressBar {
                background: #F0F0F0;
                border-radius: 4px;
                height: 8px;
                text-visible: false;
                border: none;
            }
            QProgressBar::chunk {
                background: #34c759;
                border-radius: 4px;
            }
        """)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(15, 15, 15, 15)
        layout.setSpacing(12)
        
        # Grid for Stats (Level & Time)
        top_stats = QHBoxLayout()
        self.lbl_level = QLabel("Level: B1 Intermediate")
        self.lbl_time = QLabel("Learning Time: 42:15")
        self.lbl_time.setAlignment(Qt.AlignmentFlag.AlignRight)
        top_stats.addWidget(self.lbl_level)
        top_stats.addStretch()
        top_stats.addWidget(self.lbl_time)
        layout.addLayout(top_stats)
        
        # Progress Bars Section
        bars_layout = QGridLayout()
        bars_layout.setSpacing(10)
        
        # 1. Already Learned
        bars_layout.addWidget(QLabel("Learned Words"), 0, 0)
        self.p_learned = QProgressBar()
        self.p_learned.setValue(65)
        bars_layout.addWidget(self.p_learned, 0, 1)
        
        # 2. In Repetition
        bars_layout.addWidget(QLabel("In Repetition"), 1, 0)
        self.p_repeat = QProgressBar()
        self.p_repeat.setValue(40)
        self.p_repeat.setStyleSheet("QProgressBar::chunk { background: #ff9500; }")
        bars_layout.addWidget(self.p_repeat, 1, 1)
        
        # 3. New Session
        bars_layout.addWidget(QLabel("Session New"), 2, 0)
        self.p_session = QProgressBar()
        self.p_session.setValue(85)
        self.p_session.setStyleSheet("QProgressBar::chunk { background: #4A90E2; }")
        bars_layout.addWidget(self.p_session, 2, 1)
        
        layout.addLayout(bars_layout)

class GreekLinguaApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("GreekLingua")
        self.setFixedSize(920, 520)
        
        # CSS Variables for colors
        self.accent_blue = "#4A90E2"
        self.dark_gray = "#2D2D2D"
        
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.main_layout = QVBoxLayout(self.central_widget)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        self.main_layout.setSpacing(0)
        
        self.setStyleSheet(f"""
            QMainWindow {{ background-color: #F8F9FA; }}
            QStackedWidget {{ background: transparent; }}
        """)
        
        self.init_header()
        self.stack = QStackedWidget()
        self.main_layout.addWidget(self.stack)
        
        # Init Views
        self.init_dashboard()
        self.vokabeln_view = VokabelnView()
        self.phrasen_view = PhrasenView()
        self.quiz_view = QuizView()
        self.flashcard_view = FlashcardView()
        self.stats_view = StatsView()
        self.video_view = VideoView()
        self.text_view = TextView()
        self.stories_view = StoriesView()
        self.books_view = BooksView()
        self.cyprus_view = CyprusExamMainView()
        self.cyprus_listening = CyprusListeningView()
        
        # Connect sub-navigation
        self.cyprus_view.switch_page.connect(self.stack.setCurrentIndex)
        self.cyprus_listening.back_to_main.connect(lambda: self.stack.setCurrentIndex(10))
        
        self.stack.addWidget(self.dashboard_scroll) # Index 0
        self.stack.addWidget(self.vokabeln_view)     # Index 1
        self.stack.addWidget(self.phrasen_view)      # Index 2
        self.stack.addWidget(self.quiz_view)        # Index 3
        self.stack.addWidget(self.flashcard_view)   # Index 4
        self.stack.addWidget(self.stats_view)       # Index 5
        self.stack.addWidget(self.video_view)       # Index 6
        self.stack.addWidget(self.text_view)        # Index 7
        self.stack.addWidget(self.stories_view)     # Index 8
        self.stack.addWidget(self.books_view)       # Index 9
        self.stack.addWidget(self.cyprus_view)      # Index 10
        self.stack.addWidget(self.cyprus_listening) # Index 11

    def init_header(self):
        self.header = QFrame()
        self.header.setFixedHeight(48)
        self.header.setStyleSheet("background: white; border-bottom: 1px solid #E0E0E0;")
        layout = QHBoxLayout(self.header)
        layout.setContentsMargins(15, 0, 15, 0)
        
        self.back_btn = QPushButton(" ← Dashboard")
        self.back_btn.setStyleSheet(f"font-weight: 700; color: {self.accent_blue}; border: none; font-size: 12px;")
        self.back_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.back_btn.setVisible(False)
        self.back_btn.clicked.connect(self.go_home)
        
        self.title = QLabel("GreekLingua")
        self.title.setStyleSheet(f"font-size: 16px; font-weight: 800; color: {self.dark_gray};")
        
        layout.addWidget(self.back_btn)
        layout.addWidget(self.title)
        layout.addStretch()
        streak_lbl = QLabel("🔥 14 Days")
        streak_lbl.setStyleSheet("font-size: 12px; font-weight: 600;")
        layout.addWidget(streak_lbl)
        self.main_layout.addWidget(self.header)

    def init_dashboard(self):
        self.dashboard_scroll = QScrollArea()
        self.dashboard_scroll.setWidgetResizable(True)
        self.dashboard_scroll.setFrameShape(QFrame.Shape.NoFrame)
        # Disable scroll bars as we aim to fit everything
        self.dashboard_scroll.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.dashboard_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        
        container = QWidget()
        # Main layout is now horizontal
        main_h_layout = QHBoxLayout(container)
        main_h_layout.setContentsMargins(20, 20, 20, 20)
        main_h_layout.setSpacing(25)
        
        # Left Side: Stats Display (~33% width)
        self.stats_panel = DashboardStats()
        self.stats_panel.setFixedWidth(260)
        main_h_layout.addWidget(self.stats_panel, 0, Qt.AlignmentFlag.AlignTop)
        
        # Right Side: Module Grid
        grid_widget = QWidget()
        grid = QGridLayout(grid_widget)
        grid.setContentsMargins(0, 0, 0, 0)
        grid.setSpacing(12)
        main_h_layout.addWidget(grid_widget, 1, Qt.AlignmentFlag.AlignTop)
        
        modules = [
            ("Lernen", "🚀", "START"),
            ("Vokabeln", "📚", "REVIEW"),
            ("Phrasen", "💬", ""),
            ("Quiz", "🧠", "10 min"),
            ("Statistik", "📊", ""),
            ("Video", "🎬", ""),
            ("Texte", "📖", ""),
            ("Short Stories", "📝", ""),
            ("Bücher", "📎", ""),
            ("Zypern", "🇨🇾", "")
        ]
        
        for i, (name, emoji, status) in enumerate(modules):
            tile = ModuleTile(name, emoji, status)
            tile.clicked.connect(self.handle_navigation)
            grid.addWidget(tile, i // 4, i % 4)
        self.dashboard_scroll.setWidget(container)

    def handle_navigation(self, title):
        self.back_btn.setVisible(True)
        if title == "Vokabeln": self.stack.setCurrentIndex(1)
        elif title == "Phrasen": self.stack.setCurrentIndex(2)
        elif title == "Quiz": self.stack.setCurrentIndex(3)
        elif title == "Lernen": self.stack.setCurrentIndex(4)
        elif title == "Statistik": self.stack.setCurrentIndex(5)
        elif title == "Video": self.stack.setCurrentIndex(6)
        elif title == "Texte": self.stack.setCurrentIndex(7)
        elif title == "Short Stories": self.stack.setCurrentIndex(8)
        elif title == "Bücher": self.stack.setCurrentIndex(9)
        elif title == "Zypern": self.stack.setCurrentIndex(10)
        self.title.setText(f"Module: {title}")

    def go_home(self):
        self.stack.setCurrentIndex(0)
        self.back_btn.setVisible(False)
        self.title.setText("GreekLingua")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyle("Fusion")
    gui = GreekLinguaApp()
    gui.show()
    sys.exit(app.exec())

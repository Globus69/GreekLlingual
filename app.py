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
        self.setFixedSize(220, 220)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setObjectName("ModuleTile")
        self.title = title
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(10)
        
        # Status Badge (if any)
        if status:
            status_label = QLabel(status)
            status_label.setStyleSheet(f"""
                font-size: 10px; font-weight: 800; color: white; 
                background: #34c759; padding: 4px 8px; border-radius: 10px;
            """)
            status_label.setFixedWidth(60)
            status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            layout.addWidget(status_label, 0, Qt.AlignmentFlag.AlignRight)
        else:
            layout.addSpacing(20)
        
        # Icon
        self.icon_label = QLabel(icon_emoji)
        self.icon_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.icon_label.setStyleSheet("font-size: 64px;")
        
        # Title
        self.title_label = QLabel(title)
        self.title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.title_label.setStyleSheet("font-size: 18px; font-weight: 700; color: #2D2D2D;")
        
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
            padding: 8px; border-radius: 10px; border: 1px solid #FFEB3B;
            margin-bottom: 20px;
        """)
        self.setAlignment(Qt.AlignmentFlag.AlignCenter)

class VokabelnView(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(50, 20, 50, 50)
        layout.setSpacing(20)
        
        layout.addWidget(IntroHeader())
        
        title = QLabel("Vocabulary Learning")
        title.setStyleSheet("font-size: 32px; font-weight: 800; color: #2D2D2D;")
        layout.addWidget(title)
        
        # Filters Section
        filter_group = QGroupBox("Learning Configuration")
        filter_group.setStyleSheet("font-weight: 700; color: #2D2D2D;")
        g_layout = QGridLayout(filter_group)
        g_layout.setSpacing(15)
        
        self.cb_repeat = QCheckBox("Repeat learned vocabulary")
        self.cb_new = QCheckBox("New words (Random - Level based)")
        self.cb_teacher = QCheckBox("Teacher's Pick (1:1 Lessons)")
        
        g_layout.addWidget(self.cb_repeat, 0, 0)
        g_layout.addWidget(self.cb_new, 1, 0)
        g_layout.addWidget(self.cb_teacher, 2, 0)
        
        theme_label = QLabel("Select Theme:")
        self.theme_combo = QComboBox()
        self.theme_combo.addItems(["All", "Travel", "Shopping", "Food & Drink", "Health", "Social"])
        self.theme_combo.setStyleSheet("padding: 8px; border-radius: 10px; min-width: 200px;")
        
        g_layout.addWidget(theme_label, 3, 0)
        g_layout.addWidget(self.theme_combo, 4, 0)
        
        layout.addWidget(filter_group)
        
        # Start Button
        start_btn = QPushButton("🚀 Start Learning Session")
        start_btn.setStyleSheet("""
            background: #4A90E2; color: white; border-radius: 15px; 
            padding: 20px; font-size: 18px; font-weight: 800;
        """)
        layout.addWidget(start_btn)
        layout.addStretch()

class PhrasenView(QWidget):
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(50, 20, 50, 50)
        layout.setSpacing(20)
        
        layout.addWidget(IntroHeader())
        
        title = QLabel("Common Phrases")
        title.setStyleSheet("font-size: 32px; font-weight: 800; color: #2D2D2D;")
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
            p_frame.setStyleSheet("background: white; border-radius: 12px; border: 1px solid #E0E0E0;")
            p_layout = QHBoxLayout(p_frame)
            p_layout.setContentsMargins(20, 15, 20, 15)
            
            e_lbl = QLabel(eng)
            e_lbl.setStyleSheet("font-weight: 600; font-size: 16px;")
            g_lbl = QLabel(gr)
            g_lbl.setStyleSheet("font-size: 16px; color: #4A90E2; font-weight: 700;")
            
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
        layout.setContentsMargins(50, 20, 50, 50)
        layout.setSpacing(20)
        
        layout.addWidget(IntroHeader())
        
        title = QLabel("Reading Quiz: Underlined Nouns")
        title.setStyleSheet("font-size: 32px; font-weight: 800; color: #2D2D2D;")
        layout.addWidget(title)
        
        # Interactive Text
        text_container = QFrame()
        text_container.setStyleSheet("background: white; border-radius: 24px; border: 1px solid #E0E0E0; padding: 30px;")
        t_layout = QVBoxLayout(text_container)
        
        self.content_lbl = QLabel()
        self.content_lbl.setWordWrap(True)
        self.content_lbl.setStyleSheet("font-size: 20px; color: #2D2D2D; line-height: 1.6;")
        
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
        layout.setContentsMargins(50, 20, 50, 50)
        layout.setSpacing(30)
        
        layout.addWidget(IntroHeader())
        
        # Card Container
        self.card = QFrame()
        self.card.setFixedHeight(450)
        self.card.setObjectName("Flashcard")
        self.card.setCursor(Qt.CursorShape.PointingHandCursor)
        self.card_layout = QVBoxLayout(self.card)
        self.card_layout.setContentsMargins(40, 40, 40, 40)
        
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
            self.card.setStyleSheet("#Flashcard { background: white; border: 1px solid #E0E0E0; border-radius: 32px; }")
            greek_word = QLabel("Το ψωμί")
            greek_word.setStyleSheet("font-size: 72px; font-weight: 800; color: #2D2D2D;")
            self.card_layout.addStretch()
            self.card_layout.addWidget(greek_word, 0, Qt.AlignmentFlag.AlignCenter)
            self.card_layout.addStretch()
        else:
            self.card.setStyleSheet("#Flashcard { background: var(--accent-gradient); border-radius: 32px; color: white; }")
            english_word = QLabel("Bread")
            english_word.setStyleSheet("font-size: 80px; font-weight: 800; color: white;")
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
        layout.setContentsMargins(50, 20, 50, 50)
        layout.setSpacing(30)
        layout.addWidget(IntroHeader())
        
        title = QLabel("Performance Hub")
        title.setStyleSheet("font-size: 32px; font-weight: 800; color: #2D2D2D;")
        layout.addWidget(title)
        
        graph_box = QFrame()
        graph_box.setFixedHeight(250)
        graph_box.setStyleSheet("background: white; border: 1px solid #E0E0E0; border-radius: 24px;")
        g_layout = QHBoxLayout(graph_box)
        g_layout.setContentsMargins(30, 80, 30, 20)
        for h in [40, 60, 45, 90, 65, 80, 100]:
            bar = QFrame()
            bar.setStyleSheet("background: #4A90E2; border-radius: 8px;")
            bar.setFixedHeight(int(h * 1.5))
            g_layout.addWidget(bar, 0, Qt.AlignmentFlag.AlignBottom)
        layout.addWidget(graph_box)
        layout.addStretch()

class GreekLinguaApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("GreekLingua")
        self.resize(1200, 800)
        
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
        
        self.stack.addWidget(self.dashboard_scroll) # Index 0
        self.stack.addWidget(self.vokabeln_view)     # Index 1
        self.stack.addWidget(self.phrasen_view)      # Index 2
        self.stack.addWidget(self.quiz_view)        # Index 3
        self.stack.addWidget(self.flashcard_view)   # Index 4
        self.stack.addWidget(self.stats_view)       # Index 5

    def init_header(self):
        self.header = QFrame()
        self.header.setFixedHeight(80)
        self.header.setStyleSheet("background: white; border-bottom: 1px solid #E0E0E0;")
        layout = QHBoxLayout(self.header)
        layout.setContentsMargins(30, 0, 30, 0)
        
        self.back_btn = QPushButton(" ← Dashboard")
        self.back_btn.setStyleSheet(f"font-weight: 700; color: {self.accent_blue}; border: none; font-size: 14px;")
        self.back_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.back_btn.setVisible(False)
        self.back_btn.clicked.connect(self.go_home)
        
        self.title = QLabel("GreekLingua")
        self.title.setStyleSheet(f"font-size: 24px; font-weight: 800; color: {self.dark_gray};")
        
        layout.addWidget(self.back_btn)
        layout.addWidget(self.title)
        layout.addStretch()
        layout.addWidget(QLabel("🔥 14 Days"))
        self.main_layout.addWidget(self.header)

    def init_dashboard(self):
        self.dashboard_scroll = QScrollArea()
        self.dashboard_scroll.setWidgetResizable(True)
        self.dashboard_scroll.setFrameShape(QFrame.Shape.NoFrame)
        container = QWidget()
        grid = QGridLayout(container)
        grid.setContentsMargins(50, 50, 50, 50)
        grid.setSpacing(30)
        
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

import io
from datetime import datetime
from typing import List, Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from app.core.config import settings

# Регистрация шрифтов с поддержкой кириллицы
try:
    pdfmetrics.registerFont(TTFont("Arial", "C:\\Windows\\Fonts\\arial.ttf"))
    pdfmetrics.registerFont(TTFont("Arial-Bold", "C:\\Windows\\Fonts\\arialbd.ttf"))
    DEFAULT_FONT = "Arial"
    DEFAULT_FONT_BOLD = "Arial-Bold"
except Exception:
    DEFAULT_FONT = "Helvetica"
    DEFAULT_FONT_BOLD = "Helvetica-Bold"


class NumberedCanvas(canvas.Canvas):
    """Холст с автоматической нумерацией страниц и нижним колонтитулом"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count: int):
        self.saveState()
        self.setFont(DEFAULT_FONT, 8)
        self.setFillColor(colors.HexColor("#64748B"))
        footer_text = f"АИС «Забота» — Мэрия г. Кызыла | Документ сформирован автоматически {datetime.now().strftime('%d.%m.%Y %H:%M')}"
        self.drawString(54, 30, footer_text)
        page_str = f"Стр. {self._pageNumber} из {page_count}"
        self.drawRightString(A4[0] - 54, 30, page_str)
        self.restoreState()


class PDFService:
    """Сервис генерации официальных бланков, справок и грамот в формате PDF"""

    @staticmethod
    def generate_practice_certificate(
        volunteer_name: str,
        phone: str,
        district_name: str,
        total_hours: int,
        tasks_completed: int,
        tasks_list: List[dict]
    ) -> bytes:
        """
        Генерация официальной «Справки о прохождении социальной практики» волонтером
        для предоставления в учебное заведение (колледж/техникум/ВУЗ).
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=54,
            rightMargin=54,
            topMargin=40,
            bottomMargin=50
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "DocTitle",
            fontName=DEFAULT_FONT_BOLD,
            fontSize=15,
            leading=18,
            alignment=1,
            textColor=colors.HexColor("#1E3A8A")
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            fontName=DEFAULT_FONT,
            fontSize=9,
            leading=12,
            alignment=1,
            textColor=colors.HexColor("#475569")
        )
        body_style = ParagraphStyle(
            "DocBody",
            fontName=DEFAULT_FONT,
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#1E293B")
        )
        bold_style = ParagraphStyle(
            "DocBold",
            fontName=DEFAULT_FONT_BOLD,
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#1E293B")
        )

        story = []

        # Шапка Мэрии
        story.append(Paragraph("МЭРИЯ ГОРОДА КЫЗЫЛА", title_style))
        story.append(Spacer(1, 3))
        story.append(Paragraph(settings.MUNICIPALITY_NAME.upper(), subtitle_style))
        story.append(Paragraph(f"{settings.ADDRESS} • Тел: {settings.PHONE_HOTLINE}", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E3A8A"), spaceAfter=15))

        # Заголовок документа
        doc_num = f"СП-КЗ-{datetime.now().strftime('%Y')}/{tasks_completed:03d}"
        story.append(Paragraph("СПРАВКА", ParagraphStyle("H1", fontName=DEFAULT_FONT_BOLD, fontSize=16, alignment=1, textColor=colors.HexColor("#0F172A"))))
        story.append(Paragraph(f"о прохождении социальной (волонтерской) практики № {doc_num}", ParagraphStyle("H2", fontName=DEFAULT_FONT, fontSize=11, alignment=1, textColor=colors.HexColor("#334155"))))
        story.append(Spacer(1, 15))

        # Текст справки
        text = (
            f"Настоящая справка выдана <b>{volunteer_name}</b> (контактный телефон: {phone}), "
            f"в том, что он(а) в период 2025–2026 гг. действительно принимал(а) активное участие "
            f"в реализации муниципальной программы адресной социальной помощи гражданам города Кызыла "
            f"в качестве волонтера АИС «Забота»."
        )
        story.append(Paragraph(text, body_style))
        story.append(Spacer(1, 10))

        # Таблица ключевых показателей
        stats_data = [
            [Paragraph("Основной район деятельности:", bold_style), Paragraph(district_name, body_style)],
            [Paragraph("Всего выполнено адресных заявок:", bold_style), Paragraph(f"{tasks_completed} заявок", body_style)],
            [Paragraph("Итого наработано часов практики:", bold_style), Paragraph(f"<b>{total_hours} академических часов</b>", body_style)],
            [Paragraph("Статус верификации отчетов:", bold_style), Paragraph("Все фотоотчеты «До/После» проверены инспекцией", body_style)]
        ]
        stats_table = Table(stats_data, colWidths=[200, 280])
        stats_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(stats_table)
        story.append(Spacer(1, 15))

        # Выписка из реестра выполненных заданий (если есть)
        if tasks_list:
            story.append(Paragraph("<b>Выписка из журнала выполненных заданий:</b>", bold_style))
            story.append(Spacer(1, 6))
            table_rows = [["№", "Номер заявки", "Категория помощи", "Адрес в Кызыле", "Дата", "Часы"]]
            for idx, t in enumerate(tasks_list[:8], 1):
                table_rows.append([
                    str(idx),
                    t.get("uin", "-"),
                    t.get("category", "-"),
                    t.get("address", "-")[:25] + "...",
                    t.get("date", "-"),
                    f"+{t.get('hours', 2)} ч."
                ])

            table = Table(table_rows, colWidths=[25, 90, 115, 160, 55, 35])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), DEFAULT_FONT_BOLD),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("ALIGN", (2, 1), (3, -1), "LEFT"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(table)
            story.append(Spacer(1, 20))

        # Подписи и печать
        sign_data = [
            [
                Paragraph("<b>Начальник Департамента по социальной политике</b><br/>мэрии города Кызыла", body_style),
                Paragraph("___________________ / А. К. Ондар /<br/><i>(М.П. подпись и печать)</i>", ParagraphStyle("Sign", fontName=DEFAULT_FONT, fontSize=9, alignment=2))
            ],
            [
                Paragraph("<b>Ведущий специалист-инспектор АИС «Забота»</b>", body_style),
                Paragraph("___________________ / Ч. С. Куулар /", ParagraphStyle("Sign2", fontName=DEFAULT_FONT, fontSize=9, alignment=2))
            ]
        ]
        sign_table = Table(sign_data, colWidths=[260, 220])
        sign_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(sign_table)

        doc.build(story, canvasmaker=NumberedCanvas)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_volunteer_certificate(
        volunteer_name: str,
        certificate_title: str,
        description: str,
        certificate_code: str
    ) -> bytes:
        """Генерация почетной грамоты / благодарственного письма мэрии Кызыла"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=50,
            rightMargin=50,
            topMargin=50,
            bottomMargin=50
        )

        styles = getSampleStyleSheet()
        story = []

        # Торжественная рамка
        story.append(Spacer(1, 20))
        story.append(Paragraph("ДЕПАРТАМЕНТ ПО СОЦИАЛЬНОЙ ПОЛИТИКЕ", ParagraphStyle("G1", fontName=DEFAULT_FONT_BOLD, fontSize=12, alignment=1, textColor=colors.HexColor("#1E3A8A"))))
        story.append(Paragraph("МЭРИИ ГОРОДА КЫЗЫЛА", ParagraphStyle("G2", fontName=DEFAULT_FONT_BOLD, fontSize=14, alignment=1, textColor=colors.HexColor("#1E3A8A"))))
        story.append(Spacer(1, 25))

        story.append(Paragraph("ПОЧЕТНАЯ ГРАМОТА", ParagraphStyle("TitleBig", fontName=DEFAULT_FONT_BOLD, fontSize=24, alignment=1, textColor=colors.HexColor("#D97706"))))
        story.append(Paragraph("И БЛАГОДАРСТВЕННОЕ ПИСЬМО", ParagraphStyle("TitleSub", fontName=DEFAULT_FONT_BOLD, fontSize=13, alignment=1, textColor=colors.HexColor("#475569"))))
        story.append(Spacer(1, 25))

        story.append(Paragraph("НАГРАЖДАЕТСЯ", ParagraphStyle("Nagr", fontName=DEFAULT_FONT, fontSize=12, alignment=1, textColor=colors.HexColor("#64748B"))))
        story.append(Spacer(1, 10))
        story.append(Paragraph(f"<b>{volunteer_name}</b>", ParagraphStyle("VolName", fontName=DEFAULT_FONT_BOLD, fontSize=18, alignment=1, textColor=colors.HexColor("#0F172A"))))
        story.append(Spacer(1, 20))

        story.append(Paragraph(f"<i>«{certificate_title}»</i>", ParagraphStyle("CertT", fontName=DEFAULT_FONT_BOLD, fontSize=13, alignment=1, textColor=colors.HexColor("#1E3A8A"))))
        story.append(Spacer(1, 10))
        story.append(Paragraph(description, ParagraphStyle("CertD", fontName=DEFAULT_FONT, fontSize=11, leading=16, alignment=1, textColor=colors.HexColor("#334155"))))
        story.append(Spacer(1, 40))

        # Нижний блок реквизитов
        meta_data = [
            [
                Paragraph(f"Код верификации: <b>{certificate_code}</b><br/>г. Кызыл, {datetime.now().strftime('%Y')} г.", ParagraphStyle("M1", fontName=DEFAULT_FONT, fontSize=9)),
                Paragraph("<b>Мэр города Кызыла</b><br/>/ _____________________ /", ParagraphStyle("M2", fontName=DEFAULT_FONT, fontSize=10, alignment=2))
            ]
        ]
        t = Table(meta_data, colWidths=[240, 240])
        t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "BOTTOM")]))
        story.append(t)

        doc.build(story, canvasmaker=NumberedCanvas)
        buffer.seek(0)
        return buffer.getvalue()

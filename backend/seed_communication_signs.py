"""Seed starter communication vocabulary without overwriting existing signs.

Run with DATABASE_URL set to the target database. The records deliberately do
not include video URLs: production videos must be uploaded with permission and
attached through the admin interface.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_engine
from app.models import Sign


SOURCE = 'Danh mục nhãn nhận diện VSL nội bộ; cần gắn video đã được cấp quyền.'
REGION = 'Chưa phân vùng'

SIGNS = [
    ('Chào hỏi', 'Chào', 'Lời chào cơ bản để bắt đầu cuộc trò chuyện.'),
    ('Chào hỏi', 'Cảm ơn', 'Biểu đạt sự biết ơn trong giao tiếp hằng ngày.'),
    ('Chào hỏi', 'Xin lỗi', 'Dùng khi cần xin lỗi hoặc thể hiện sự tiếc nuối.'),
    ('Học tập', 'Trường học', 'Từ vựng dùng trong bối cảnh lớp học và giáo dục.'),
    ('Học tập', 'Học sinh', 'Từ vựng chỉ người học trong môi trường giáo dục.'),
    ('Học tập', 'Dạy dỗ', 'Từ vựng liên quan đến hoạt động giảng dạy.'),
    ('Ăn uống', 'Ăn', 'Động từ dùng trong các tình huống bữa ăn.'),
    ('Ăn uống', 'Uống', 'Động từ dùng khi nói về đồ uống và nhu cầu hằng ngày.'),
    ('Ăn uống', 'Thức ăn', 'Từ vựng chung cho đồ ăn và bữa ăn.'),
    ('Di chuyển', 'Đi', 'Động từ dùng khi nói về việc di chuyển.'),
    ('Di chuyển', 'Xe máy', 'Từ vựng về phương tiện đi lại phổ biến.'),
    ('Di chuyển', 'Ô tô', 'Từ vựng về phương tiện đi lại.'),
    ('Sức khỏe', 'Bệnh viện', 'Từ vựng cần thiết khi trao đổi về chăm sóc sức khỏe.'),
    ('Sức khỏe', 'Khẩu trang', 'Từ vựng về dụng cụ bảo vệ sức khỏe.'),
    ('Sức khỏe', 'Giúp', 'Từ vựng dùng khi cần hỗ trợ.'),
    ('Thời gian', 'Hôm nay', 'Từ vựng chỉ thời điểm trong ngày.'),
    ('Thời gian', 'Trưa', 'Từ vựng chỉ thời điểm buổi trưa.'),
    ('Thời gian', 'Tối', 'Từ vựng chỉ thời điểm buổi tối.'),
]


def main() -> None:
    created = 0
    with Session(get_engine()) as session:
        for topic, label, description in SIGNS:
            existing = session.scalar(select(Sign.id).where(Sign.topic == topic, Sign.label == label))
            if existing:
                continue
            session.add(Sign(
                label=label,
                topic=topic,
                region=REGION,
                description=description,
                video_url=None,
                source=SOURCE,
                is_published=True,
            ))
            created += 1
        session.commit()
    print(f'Created {created} communication signs; skipped {len(SIGNS) - created} existing signs.')


if __name__ == '__main__':
    main()

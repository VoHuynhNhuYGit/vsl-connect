import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { ThemeIcon } from '../components/ui/ThemeIcon';
import { ThemeArtwork } from '../components/common/ThemeArtwork';
import { siteThemes } from '../config/themes';
import { useTheme } from '../context/ThemeContext';
import { AnimatedBackdrop } from '../components/common/AnimatedBackdrop';
import { DefaultHomePage } from './DefaultHomePage';
import './themed-home.css';

const journeys = [
  { icon: 'school', title: 'Lộ trình học', description: 'Từng bước làm quen với ngôn ngữ ký hiệu.', to: '/lo-trinh-hoc-tap' },
  { icon: 'auto_stories', title: 'Từ điển ký hiệu', description: 'Tìm một từ, mở thêm một cách diễn đạt.', to: '/tu-dien-ky-hieu' },
  { icon: 'track_changes', title: 'Luyện tập', description: 'Dành thời gian quan sát và thực hành.', to: '/luyen-tap' },
  { icon: 'layers', title: 'Ôn tập', description: 'Ghi nhớ qua những trò chơi tương tác.', to: '/on-tap' },
  { icon: 'forum', title: 'Giao tiếp', description: 'Mang những điều đã học vào kết nối.', to: '/giao-tiep' },
];
const layoutNotes = {
  patterns: { label: 'GÓC HỌC CỦA BẠN', title: 'Gom từng nét nhỏ, mở những kết nối.', action: 'Chọn một điều để khám phá', detail: 'Mỗi ký hiệu là một nét màu trong hành trình của bạn.' },
  puppets: { label: 'KHÔNG GIAN KHÁM PHÁ', title: 'Cùng bước vào một cuộc trò chuyện mới.', action: 'Hôm nay, bắt đầu từ đâu?', detail: 'Quan sát, thử sức và kết nối theo nhịp riêng của bạn.' },
  dongho: { label: 'MỖI NGÀY MỘT NÉT HỌC', title: 'Học bằng ánh mắt. Kể bằng đôi tay.', action: 'Những trang học đang mở', detail: 'Chậm một chút để nhìn rõ. Thực hành để nhớ lâu.' },
  heritage: { label: 'HÀNH TRÌNH KẾT NỐI', title: 'Mở một lối học. Gần nhau thêm chút.', action: 'Điểm đến tiếp theo của bạn', detail: 'Từ những ký hiệu đầu tiên đến những cuộc trò chuyện gần gũi.' },
};

export function HomePage() {
  const { siteTheme } = useTheme();
  if (siteTheme === 'default') return <DefaultHomePage />;
  const current = siteThemes.find(item => item.id === siteTheme)!;
  const note = layoutNotes[siteTheme];
  return <div className={`cultural-home cultural-home--${siteTheme}`}>
    <AnimatedBackdrop variant="hero" />
    <div className="cultural-home-grid">
      <section className="cultural-intro" aria-labelledby="home-title">
        <p className="theme-eyebrow"><span className="cultural-edition">{current.number}</span>{note.label}</p>
        <h1 id="home-title">{note.title}</h1>
        <p className="cultural-description">Học cách lắng nghe bằng ánh mắt, kể chuyện bằng đôi tay. Khám phá ngôn ngữ ký hiệu Việt Nam, theo nhịp riêng của bạn.</p>
        <div className="cultural-actions">
          <Link to="/lo-trinh-hoc-tap" className="cultural-primary">Bắt đầu hành trình<Icon name="arrow_forward" /></Link>
          <Link to="/tu-dien-ky-hieu" className="cultural-secondary"><ThemeIcon name="auto_stories" />Khám phá từ điển</Link>
        </div>
        <p className="cultural-footnote"><ThemeIcon name="sign_language" />Ngôn ngữ ký hiệu Việt Nam · VSL Connect</p>
      </section>
      <figure className="cultural-art">
        <div className="cultural-art-label"><span>{current.tag}</span><span aria-hidden="true">{current.number} / 04</span></div>
        <ThemeArtwork theme={siteTheme} className="cultural-artwork" />
        <figcaption><strong>{current.name}</strong><span>{current.motif}</span></figcaption>
      </figure>
      <section className="cultural-explore" aria-labelledby="explore-title">
        <div className="cultural-section-heading"><div><p className="theme-eyebrow">CHỌN NHỊP HỌC CỦA BẠN</p><h2 id="explore-title">{note.action}</h2></div><p>{note.detail}</p></div>
        <div className="cultural-journeys">{journeys.map((item, index) => <Link key={item.to} to={item.to} className="cultural-journey">
          <span className="cultural-journey-number" aria-hidden="true">0{index + 1}</span>
          <span className="cultural-icon"><ThemeIcon name={item.icon} /></span>
          <span className="cultural-journey-copy"><h3>{item.title}</h3><span>{item.description}</span></span>
          <Icon name="arrow_outward" className="cultural-journey-arrow" />
        </Link>)}</div>
      </section>
    </div>
  </div>;
}

export const siteThemes = [
  { id: 'default', name: 'Mặc định', subtitle: 'Xanh ngọc nguyên bản', description: 'Giao diện VSL Connect ban đầu với nền sáng, màu xanh ngọc và bố cục học tập quen thuộc.', number: '00', colors: ['#059669', '#14b8a6', '#e2e8f0'], ink: '#0f172a', paper: '#ffffff', tag: 'VSL CONNECT NGUYÊN BẢN', note: 'Không gian học quen thuộc của bạn.', motif: 'Gọn gàng · Dễ tiếp cận' },
  { id: 'patterns', name: 'Họa sắc Việt', subtitle: 'Nét duyên trong từng họa tiết', description: 'Hồng sen, lam ngọc và vàng ấm hòa cùng nét vẽ kiến trúc Huế, đèn lồng và nhịp sống Việt.', number: '01', colors: ['#a72b69', '#199baf', '#e8b84c'], ink: '#482a43', paper: '#fff8f3', tag: 'HỌA TIẾT & SẮC MÀU', note: 'Một không gian học mang nét duyên Việt.', motif: 'Nét Huế · Đèn lồng · Sắc Việt' },
  { id: 'puppets', name: 'Rối nước', subtitle: 'Một sân khấu của sự kết nối', description: 'Thủy đình đỏ son, con rối sơn mài và ánh vàng phản chiếu trên làn nước xanh ngọc.', number: '02', colors: ['#146b83', '#c24d50', '#e9b54d'], ink: '#183e49', paper: '#f2f9f8', tag: 'VĂN HÓA & CHUYỂN ĐỘNG', note: 'Để mỗi bài học là một cuộc gặp gỡ.', motif: 'Thủy đình · Con rối · Sóng nước' },
  { id: 'dongho', name: 'Đông Hồ', subtitle: 'Nét mộc, sắc màu, chuyện Việt', description: 'Giấy điệp, đỏ gạch và xanh lá hòa cùng những nét khắc mộc mạc của tranh dân gian.', number: '03', colors: ['#aa402b', '#416249', '#d5a23a'], ink: '#3e3828', paper: '#f8f1de', tag: 'DÂN GIAN & CÂU CHUYỆN', note: 'Gieo một nét học, giữ một nét văn hóa.', motif: 'Giấy điệp · Nét khắc dân gian' },
  { id: 'heritage', name: 'Dấu ấn Việt Nam', subtitle: 'Thân quen mà luôn mới mẻ', description: 'Sắc lúa vàng, làn nước xanh và ánh bình minh gợi nét đẹp ruộng bậc thang, vịnh Hạ Long và Hồ Gươm.', number: '04', colors: ['#ae382d', '#2461a2', '#e7b736'], ink: '#423229', paper: '#fff8e9', tag: 'DI SẢN & ĐỜI SỐNG', note: 'Kết nối hôm nay, mang theo dấu ấn Việt.', motif: 'Lúa vàng · Hạ Long · Hồ Gươm' },
] as const;

export type SiteTheme = typeof siteThemes[number]['id'];
export function isSiteTheme(value: unknown): value is SiteTheme {
  return siteThemes.some((item) => item.id === value);
}

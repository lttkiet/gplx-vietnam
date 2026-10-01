export type Category = "Quy tắc giao thông" | "Biển báo đường bộ" | "Kỹ thuật lái xe" | "Văn hóa giao thông" | "Sa hình";

export type Question = {
  id: number;
  category: Category;
  question: string;
  answers: string[];
  correct: number;
  explanation: string;
  critical?: boolean;
};

export const questions: Question[] = [
  { id: 1, category: "Quy tắc giao thông", question: "Người lái xe phải làm gì khi đèn tín hiệu giao thông chuyển sang màu vàng?", answers: ["Tăng tốc đi qua nút giao", "Dừng trước vạch dừng, trừ khi đã đi quá gần vạch", "Bấm còi và tiếp tục", "Chuyển sang làn bên trái"], correct: 1, explanation: "Đèn vàng yêu cầu dừng trước vạch. Nếu đã ở quá gần vạch mà dừng lại có thể nguy hiểm, người lái được tiếp tục đi.", critical: true },
  { id: 2, category: "Biển báo đường bộ", question: "Biển báo hình tròn, viền đỏ thường thuộc nhóm nào?", answers: ["Biển báo nguy hiểm", "Biển hiệu lệnh", "Biển báo cấm", "Biển chỉ dẫn"], correct: 2, explanation: "Phần lớn biển báo cấm có dạng hình tròn, viền đỏ, nền trắng và hình vẽ màu đen." },
  { id: 3, category: "Văn hóa giao thông", question: "Khi thấy người đi bộ đang qua đường tại vạch kẻ, người lái xe nên xử lý thế nào?", answers: ["Bấm còi để người đi bộ tránh", "Giảm tốc độ và nhường đường", "Lách qua phía sau người đi bộ", "Giữ nguyên tốc độ"], correct: 1, explanation: "Người lái xe phải quan sát, giảm tốc độ và nhường đường cho người đi bộ tại vị trí dành cho người đi bộ." },
  { id: 4, category: "Kỹ thuật lái xe", question: "Khi xuống dốc dài, cách điều khiển xe an toàn là gì?", answers: ["Tắt máy để tiết kiệm nhiên liệu", "Về số thấp, kết hợp phanh động cơ", "Giữ côn liên tục", "Chỉ sử dụng phanh chân"], correct: 1, explanation: "Về số thấp giúp tận dụng lực hãm động cơ, tránh làm phanh chân quá nóng và mất hiệu quả." },
  { id: 5, category: "Sa hình", question: "Tại nơi giao nhau không có báo hiệu đi theo vòng xuyến, phải nhường đường cho xe nào?", answers: ["Xe đi đến từ bên phải", "Xe đi đến từ bên trái", "Xe có kích thước lớn hơn", "Xe bấm còi trước"], correct: 0, explanation: "Tại nơi giao nhau không có báo hiệu vòng xuyến, người lái phải nhường đường cho xe đến từ bên phải." },
  { id: 6, category: "Quy tắc giao thông", question: "Người điều khiển phương tiện có được lái xe khi trong máu hoặc hơi thở có nồng độ cồn không?", answers: ["Được nếu đi quãng đường ngắn", "Được nếu vẫn tỉnh táo", "Không được phép", "Được vào ban đêm"], correct: 2, explanation: "Pháp luật nghiêm cấm điều khiển phương tiện khi trong máu hoặc hơi thở có nồng độ cồn.", critical: true },
  { id: 7, category: "Biển báo đường bộ", question: "Biển hình tam giác đều, viền đỏ, nền vàng có ý nghĩa chung là gì?", answers: ["Cảnh báo nguy hiểm", "Cấm lưu thông", "Chỉ dẫn hướng đi", "Bắt buộc thực hiện"], correct: 0, explanation: "Đây là hình dạng đặc trưng của nhóm biển báo nguy hiểm và cảnh báo." },
  { id: 8, category: "Kỹ thuật lái xe", question: "Khi lốp xe phía trước bị nổ đột ngột, thao tác phù hợp là gì?", answers: ["Đạp phanh gấp", "Giữ chắc vô lăng, giảm ga từ từ", "Đánh lái ngay vào lề", "Kéo phanh tay lập tức"], correct: 1, explanation: "Giữ chắc vô lăng và giảm tốc từ từ giúp duy trì hướng xe; phanh gấp có thể khiến xe mất kiểm soát." },
  { id: 9, category: "Văn hóa giao thông", question: "Khi gặp xe ưu tiên đang phát tín hiệu, người lái xe phải làm gì?", answers: ["Tăng tốc để tránh cản đường", "Nhanh chóng giảm tốc, tránh hoặc dừng sát lề phải", "Đi sát phía sau xe ưu tiên", "Dừng giữa đường"], correct: 1, explanation: "Cần giảm tốc, đi sát lề phải hoặc dừng lại để nhường đường, tuyệt đối không cản trở xe ưu tiên." },
  { id: 10, category: "Sa hình", question: "Khi hai xe đi ngược chiều gặp nhau ở đường dốc hẹp, xe nào phải nhường?", answers: ["Xe xuống dốc nhường xe lên dốc", "Xe lên dốc nhường xe xuống dốc", "Xe nhỏ nhường xe lớn", "Xe nào đến sau phải nhường"], correct: 0, explanation: "Xe xuống dốc phải nhường đường cho xe đang lên dốc vì việc khởi hành lại trên dốc khó và nguy hiểm hơn." },
  { id: 11, category: "Quy tắc giao thông", question: "Khoảng cách an toàn với xe phía trước cần được điều chỉnh dựa trên yếu tố nào?", answers: ["Chỉ dựa trên tốc độ", "Tốc độ, thời tiết và tình trạng mặt đường", "Màu sơn của xe phía trước", "Kinh nghiệm của người lái"], correct: 1, explanation: "Tốc độ càng cao hoặc điều kiện quan sát, mặt đường càng xấu thì khoảng cách an toàn càng phải tăng." },
  { id: 12, category: "Biển báo đường bộ", question: "Biển tròn nền xanh, hình vẽ màu trắng thường là nhóm biển nào?", answers: ["Biển cấm", "Biển nguy hiểm", "Biển hiệu lệnh", "Biển phụ"], correct: 2, explanation: "Biển hiệu lệnh thường có dạng tròn, nền xanh và hình vẽ màu trắng, báo các điều bắt buộc thi hành." },
];

export const categories = [
  { name: "Quy tắc giao thông" as Category, icon: "book", color: "#e85b3d", bg: "#fff0ec" },
  { name: "Biển báo đường bộ" as Category, icon: "sign", color: "#2874a6", bg: "#eaf5fc" },
  { name: "Kỹ thuật lái xe" as Category, icon: "car", color: "#a66b1f", bg: "#fff6dc" },
  { name: "Văn hóa giao thông" as Category, icon: "heart", color: "#278467", bg: "#e9f7f1" },
  { name: "Sa hình" as Category, icon: "route", color: "#6e5aac", bg: "#f0edfb" },
];

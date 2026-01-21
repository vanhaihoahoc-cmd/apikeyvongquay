
import { Question } from './types';

export const PALETTE = ["#FF5252", "#FFCA28", "#42A5F5", "#66BB6A", "#EC407A", "#AB47BC", "#FFA726", "#26C6DA"];

export const DEFAULT_NAMES = [
  "Huỳnh Anh", "Gia Bảo", "Minh Đăng", "Hương Giang", "Quang Hà", 
  "Trọng Hiền", "Chí Hùng", "Nhật Huy", "Hoàng Long", "Minh Long", 
  "Gia Nghi", "Minh Nhật", "Ngọc Nhi", "Ý Nhi", "Huỳnh Như", 
  "Khánh Phương", "Hoàng Quân", "Phú Quý", "Duy Tâm", "Phúc Thành", 
  "Hữu Thiện", "Phúc Thịnh", "Thanh Thơ", "Anh Thư", "Thị Anh Thư", "Như Tuấn"
];

export const DEFAULT_QUESTIONS: Question[] = [
  {
    q: "Ester được tạo thành từ phản ứng giữa carboxylic acid và chất nào sau đây?",
    options: ["Aldehyde", "Alcohol", "Ketone", "Ether"],
    correct: 1
  },
  {
    q: "Glucose thuộc loại carbohydrate nào?",
    options: ["Disaccharide", "Polysaccharide", "Monosaccharide", "Lipid"],
    correct: 2
  },
  {
    q: "Dung dịch methylamine ($\\ce{CH3NH2}$) trong nước làm quỳ tím chuyển sang màu gì?",
    options: ["Đỏ", "Không đổi màu", "Hồng", "Xanh"],
    correct: 3
  },
  {
    q: "Amino acid là hợp chất hữu cơ tạp chức, phân tử chứa đồng thời nhóm amino ($\\ce{-NH2}$) và nhóm nào?",
    options: ["Hydroxyl ($\\ce{-OH}$)", "Aldehyde ($\\ce{-CHO}$)", "Carboxyl ($\\ce{-COOH}$)", "Ether ($\\ce{-O-}$)$"],
    correct: 2
  },
  {
    q: "Polymer nào sau đây là tơ thiên nhiên?",
    options: ["Nylon-6,6", "Tơ tằm", "Nitron", "Viscose"],
    correct: 1
  },
  {
    q: "Trong pin điện hóa $\\ce{Zn-Cu}$, cực dương (cathode) là thanh kim loại nào?",
    options: ["Thanh kẽm ($\\ce{Zn}$)", "Thanh đồng ($\\ce{Cu}$)", "Cả hai thanh", "Không xác định"],
    correct: 1
  },
  {
    q: "Phản ứng xà phòng hóa chất béo luôn thu được sản phẩm là muối của acid béo và chất nào?",
    options: ["Ethylene glycol", "Glucose", "Glycerol", "Ethanol"],
    correct: 2
  },
  {
    q: "Protein có phản ứng màu biuret với chất nào sau đây?",
    options: ["$\\ce{HNO3}$ đặc", "$\\ce{Cu(OH)2}$ trong môi trường kiềm", "Dung dịch $\\ce{I2}$", "$\\ce{AgNO3}$ trong $\\ce{NH3}$"],
    correct: 1
  },
  {
    q: "Công thức phân tử của sucrose (saccarozơ) là:",
    options: ["$\\ce{C6H12O6}$", "$\\ce{(C6H10O5)_n}$", "$\\ce{C12H22O11}$", "$\\ce{C2H4O2}$"],
    correct: 2
  },
  {
    q: "Kim loại nào sau đây có thể điều chế bằng phương pháp điện phân dung dịch?",
    options: ["Natri ($\\ce{Na}$)", "Magie ($\\ce{Mg}$)", "Nhôm ($\\ce{Al}$)", "Đồng ($\\ce{Cu}$)$"],
    correct: 3
  }
];

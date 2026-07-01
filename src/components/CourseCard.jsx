import { Link } from 'react-router-dom';
import { Star, Clock, Users, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getRegionPrice, formatPrice } from '../utils/pricing';
import './CourseCard.css';

const levelColor = {
  'Principiante': { bg: '#DCFCE7', color: '#16A34A' },
  'Intermedio':   { bg: '#FEF9C3', color: '#CA8A04' },
  'Avanzado':     { bg: '#FEE2E2', color: '#DC2626' },
};

export default function CourseCard({ course }) {
  const { region } = useApp();
  const { current, original } = getRegionPrice(course, region);
  const discount = original > 0 ? Math.round((1 - current / original) * 100) : 0;
  const lvl = levelColor[course.level] || { bg: 'var(--bg-2)', color: 'var(--text-2)' };

  return (
    <article className="course-card">
      {/* Image */}
      <div className="cc-image-wrap">
        <img src={course.image} alt={course.title} className="cc-image" loading="lazy" />
        <span className="cc-cat-badge">{course.category}</span>
        {discount > 0 && <span className="cc-discount-badge">-{discount}%</span>}
      </div>

      {/* Body */}
      <div className="cc-body">
        {/* Level pill */}
        <div className="cc-level-row">
          <span className="cc-level-pill" style={{ background: lvl.bg, color: lvl.color }}>
            {course.level}
          </span>
          <span className="cc-modality">{course.modality}</span>
        </div>

        {/* Title */}
        <h3 className="cc-title">{course.title}</h3>

        {/* Instructor */}
        <div className="cc-instructor">
          <img
            src={course.instructor?.avatar}
            alt={course.instructor?.name}
            className="cc-instructor-avatar"
          />
          <span className="cc-instructor-name">{course.instructor?.name}</span>
        </div>

        {/* Rating */}
        <div className="cc-rating">
          <Star size={12} fill="#F59E0B" color="#F59E0B" />
          <strong>{course.rating}</strong>
          <span className="cc-rating-count">({course.reviews.toLocaleString()} reseñas)</span>
        </div>

        {/* Meta */}
        <div className="cc-meta">
          <span className="cc-meta-item"><Clock size={11} /> {course.duration}</span>
          <span className="cc-meta-item"><BookOpen size={11} /> {course.hours}h</span>
          <span className="cc-meta-item"><Users size={11} /> {course.students.toLocaleString()}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="cc-footer">
        <div className="cc-price">
          <span className="cc-price-now">{formatPrice(current, region)}</span>
          {discount > 0 && <span className="cc-price-was">{formatPrice(original, region)}</span>}
        </div>
        <Link to={`/cursos/${course.id}`} className="cc-cta-btn">
          Ver curso
        </Link>
      </div>
    </article>
  );
}

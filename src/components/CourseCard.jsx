import { Link } from 'react-router-dom';
import { Star, Clock, Users, BookOpen, ArrowRight } from 'lucide-react';
import './CourseCard.css';

const levelBadge = {
  'Principiante': 'badge-green',
  'Intermedio':   'badge-amber',
  'Avanzado':     'badge-red',
};

export default function CourseCard({ course }) {
  const discount = Math.round((1 - course.price / course.originalPrice) * 100);
  return (
    <article className="course-card card card-elevated">
      <div className="course-img-wrap">
        <img src={course.image} alt={course.title} className="course-img" loading="lazy" />
        <span className="course-cat-tag">{course.category}</span>
        {discount > 0 && <span className="course-discount">-{discount}%</span>}
      </div>

      <div className="course-body">
        <div className="course-badges">
          <span className={`badge ${levelBadge[course.level] || 'badge-default'}`}>{course.level}</span>
          <span className="badge badge-default">{course.modality}</span>
        </div>

        <h3 className="course-title">{course.title}</h3>
        <p className="course-sub">{course.subtitle}</p>

        <div className="course-tags">
          {course.tags.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}
        </div>

        <div className="course-meta">
          <span className="meta-item"><Clock size={12} /> {course.duration}</span>
          <span className="meta-item"><BookOpen size={12} /> {course.hours}h</span>
          <span className="meta-item"><Users size={12} /> {course.students.toLocaleString()}</span>
        </div>

        <div className="course-rating">
          <Star size={12} fill="#F59E0B" color="#F59E0B" />
          <strong>{course.rating}</strong>
          <span>({course.reviews.toLocaleString()})</span>
        </div>

        <div className="course-footer">
          <div className="course-price">
            <span className="price-now">${course.price.toLocaleString()}</span>
            {discount > 0 && <span className="price-was">${course.originalPrice.toLocaleString()}</span>}
          </div>
          <Link to={`/cursos/${course.id}`} className="btn btn-primary btn-sm">
            Ver más <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}

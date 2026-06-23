import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Star, Info } from 'lucide-react';
import './GrandsHommes.css';

const GRANDS_HOMMES = [
  {
    id: 1,
    name: 'Al-Ghazâlî',
    title: 'Hujjat al-Islam (La preuve de l\'Islam)',
    dates: '1058 – 1111',
    description: 'Théologien, philosophe et mystique persan, il a profondément influencé le développement de la théologie islamique et du soufisme. Son œuvre majeure "Revivification des sciences de la religion" (Ihyâ\' \'ulûm ad-dîn) est un classique intemporel.',
    image: 'https://images.unsplash.com/photo-1584281720498-8fa194ddb656?auto=format&fit=crop&q=80&w=400',
    tags: ['Théologie', 'Soufisme', 'Philosophie']
  },
  {
    id: 2,
    name: 'Ibn Khaldoun',
    title: 'Père de la sociologie',
    dates: '1332 – 1406',
    description: 'Historien, philosophe, diplomate et sociologue avant l\'heure. Sa célèbre "Muqaddima" (Introduction à l\'histoire universelle) pose les bases de l\'analyse sociologique, de l\'économie et de l\'historiographie moderne.',
    image: 'https://images.unsplash.com/photo-1548624177-3e1ee454eb84?auto=format&fit=crop&q=80&w=400',
    tags: ['Histoire', 'Sociologie', 'Économie']
  },
  {
    id: 3,
    name: 'Ibn Taymiyya',
    title: 'Cheikh al-Islam',
    dates: '1263 – 1328',
    description: 'Éminent savant hanbalite, juriste et théologien. Ses écrits vastes et profonds sur la croyance (Aqida) et la jurisprudence (Fiqh) ont laissé une empreinte indélébile sur la pensée réformatrice dans le monde musulman.',
    image: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=400',
    tags: ['Aqida', 'Fiqh', 'Réforme']
  },
  {
    id: 4,
    name: 'Saladin (Salah al-Din)',
    title: 'Sultan d\'Égypte et de Syrie',
    dates: '1138 – 1193',
    description: 'Leader militaire et politique légendaire, connu pour sa justice, sa clémence et sa bravoure. Il a unifié le monde musulman et repris Jérusalem, tout en gagnant le respect de ses alliés comme de ses ennemis.',
    image: 'https://images.unsplash.com/photo-1590490359854-dfba196ceaca?auto=format&fit=crop&q=80&w=400',
    tags: ['Leadership', 'Histoire', 'Bravoure']
  }
];

export default function GrandsHommes() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="grands-hommes-page" style={{ marginTop: 'var(--nav-h)' }}>
      {/* Hero Section */}
      <section className="gh-hero">
        <div className="gh-hero-overlay"></div>
        <div className="container gh-hero-content">
          <Link to="/catalogue" className="gh-back-btn">
            <ArrowLeft size={20} />
            Retour au Catalogue
          </Link>
          <div className="gh-hero-text">
            <h1>Les Grands Hommes de l'Islam</h1>
            <p>
              Découvrez la vie, les œuvres et l'héritage impérissable des figures
              qui ont illuminé l'histoire de la civilisation islamique par leur savoir,
              leur sagesse et leur courage.
            </p>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="gh-content-section container">
        <div className="gh-header">
          <h2>Biographies & Héritage</h2>
          <p className="gh-subtitle">Une sélection de savants et leaders inspirants.</p>
        </div>

        <div className="gh-grid">
          {GRANDS_HOMMES.map((homme, index) => (
            <div className="gh-card" key={homme.id} style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="gh-card-img-wrapper">
                <img src={homme.image} alt={homme.name} className="gh-card-img" />
                <div className="gh-card-dates">{homme.dates}</div>
              </div>
              <div className="gh-card-body">
                <h3 className="gh-card-title">{homme.name}</h3>
                <h4 className="gh-card-subtitle">{homme.title}</h4>
                <div className="gh-card-tags">
                  {homme.tags.map(tag => (
                    <span key={tag} className="gh-tag">{tag}</span>
                  ))}
                </div>
                <p className="gh-card-desc">{homme.description}</p>
                <div className="gh-card-footer">
                  <button className="gh-read-more">
                    <BookOpen size={16} /> En savoir plus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="gh-info-banner">
          <div className="gh-info-icon"><Info size={24} /></div>
          <div>
            <h3>Envie d'aller plus loin ?</h3>
            <p>
              Consultez notre catalogue pour retrouver les ouvrages originaux et les 
              études consacrées à ces grands hommes.
            </p>
            <Link to="/catalogue" className="btn btn-outline" style={{ marginTop: 15, display: 'inline-block' }}>
              Explorer le catalogue
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

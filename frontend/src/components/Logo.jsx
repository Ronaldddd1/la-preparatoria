import logo from '../assets/logo-la-preparatoria.png';

export default function Logo({ className = 'w-12 h-12', sinFondo = false }) {
  if (sinFondo) {
    return <img src={logo} alt="La Preparatoria" className={`${className} object-contain`} />;
  }
  return (
    <div className={`${className} shrink-0 rounded-full bg-white shadow-soft flex items-center justify-center overflow-hidden p-0.5`}>
      <img src={logo} alt="La Preparatoria" className="w-full h-full object-contain" />
    </div>
  );
}

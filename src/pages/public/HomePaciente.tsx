import { Link } from 'react-router-dom';

const services = [
  {
    icon: '👨‍⚕️',
    title: 'Consultas Especializadas',
    description:
      'Atención médica personalizada impartida por nuestro cuadro de 4 doctores titulares en medicina general y diversas ramas diagnósticas.',
  },
  {
    icon: '📊',
    title: 'Diagnóstico e Imágenes',
    description:
      'Integración de notas médicas y adjunto digital de imágenes diagnósticas para un seguimiento visual y clínico de alta precisión.',
  },
  {
    icon: '📁',
    title: 'Expedientes Digitalizados',
    description:
      'Historiales clínicos organizados y seguros que garantizan confidencialidad e inmediatez en cada revisión periódica.',
  },
  {
    icon: '🕒',
    title: 'Agendamiento en Línea',
    description:
      'Regístrate una sola vez y programa tu consulta médica de forma rápida y sencilla desde nuestro portal digital.',
  },
  {
    icon: '🤝',
    title: 'Atención Hospitalaria & Personal',
    description:
      'Contamos con 25 profesionales en enfermería, recepción y asistencia médica listos para ofrecer una estadía reconfortante.',
  },
  {
    icon: '🛡️',
    title: 'Control de Calidad & Seguridad',
    description:
      'Estrictos protocolos sanitarios y control de capacidad para garantizar atención exclusiva, segura y puntual a cada paciente.',
  },
];

const HomePaciente = () => {
  return (
    <div className="min-h-screen w-full bg-white text-slate-700">
      {/* Navegación */}
      <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-md md:px-8">
        <a href="#inicio" className="flex items-center gap-3">
          <img
            src="../assets/Logo (Sin Fondo).png"
            alt="Sanatorio Williams"
            className="h-11 w-auto object-contain"
          />
          <div className="hidden leading-tight sm:block">
            <h2 className="font-display text-lg font-bold text-slate-900">Clínica Sanatorio Williams</h2>
            <span className="text-xs font-semibold uppercase tracking-wide text-sky-600">
              Excelencia Médica & Calidez
            </span>
          </div>
        </a>

        <ul className="flex items-center gap-3 sm:gap-6">
          <li className="hidden md:block">
            <a href="#inicio" className="text-sm font-medium text-slate-700 transition-colors hover:text-sky-600">
              Inicio
            </a>
          </li>
          <li className="hidden md:block">
            <a href="#servicios" className="text-sm font-medium text-slate-700 transition-colors hover:text-sky-600">
              Servicios
            </a>
          </li>
          <li className="hidden md:block">
            <a href="#nosotros" className="text-sm font-medium text-slate-700 transition-colors hover:text-sky-600">
              Nosotros
            </a>
          </li>
          <li>
            <Link to="/login" className="text-sm font-medium text-slate-700 transition-colors hover:text-sky-600">
              Gestión Digital
            </Link>
          </li>
          <li>
            <Link
              to="/registro-paciente"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-sky-600 to-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-600/30 transition-all hover:-translate-y-0.5 hover:shadow-sky-600/45 sm:px-6 sm:py-3 sm:text-sm"
            >
              Agendar Cita Directa
            </Link>
          </li>
        </ul>
      </header>

      {/* Hero */}
      <section
        id="inicio"
        className="flex min-h-[80vh] items-center justify-center bg-[radial-gradient(circle_at_90%_10%,_#e0f2fe_0%,_#ffffff_60%)] px-4 py-16 md:px-8"
      >
        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-teal-100 px-3.5 py-1.5 text-sm font-semibold text-teal-700">
              ✨ Más de 8 años de trayectoria y confianza
            </span>
            <h1 className="mb-5 font-display text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
              Tu salud en manos expertas con{' '}
              <span className="bg-gradient-to-br from-sky-600 to-teal-700 bg-clip-text text-transparent">
                atención humana y personalizada
              </span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-slate-500">
              En <strong>Clínica Sanatorio Williams</strong> cuidamos de ti y de tu familia. Contamos con un
              selecto equipo médico especialista y más de 25 colaboradores comprometidos con brindarte el mejor
              diagnóstico, confort y agilidad en tus consultas.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/registro-paciente"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-sky-600 to-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition-all hover:-translate-y-0.5 hover:shadow-sky-600/45"
              >
                📅 Agendar Cita Ahora
              </Link>
              <a
                href="#servicios"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-200 hover:text-sky-700"
              >
                🩺 Explorar Especialidades
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl sm:p-10">
            <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-2xl text-sky-600">
                🏥
              </div>
              <div>
                <h4 className="mb-0.5 text-lg font-semibold text-slate-900">Atención Médica Dedicada</h4>
                <span className="mt-1 inline-block rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                  Cupos semanales exclusivos
                </span>
              </div>
            </div>
            <p className="mb-5 text-sm text-slate-500">
              Nos enfocamos en un volumen controlado de pacientes para garantizar una consulta sin prisas,
              diagnósticos exhaustivos y seguimiento personalizado.
            </p>
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="mb-1.5 flex justify-between text-sm font-semibold">
                <span>Disponibilidad de Citas:</span>
                <span className="text-teal-700">Abierta para esta semana</span>
              </div>
              <div className="text-xs text-slate-500">
                ⚡ Agenda tu cita en línea completando tu registro en menos de 2 minutos.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estadísticas institucionales */}
      <section className="bg-slate-900 px-4 py-12 text-white md:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 text-center md:grid-cols-4">
          <div>
            <h3 className="mb-1 font-display text-4xl font-extrabold text-sky-400">8+</h3>
            <p className="text-sm font-medium text-slate-400">Años de servicio continuo</p>
          </div>
          <div>
            <h3 className="mb-1 font-display text-4xl font-extrabold text-sky-400">4</h3>
            <p className="text-sm font-medium text-slate-400">Médicos Especialistas</p>
          </div>
          <div>
            <h3 className="mb-1 font-display text-4xl font-extrabold text-sky-400">25</h3>
            <p className="text-sm font-medium text-slate-400">Colaboradores dedicados</p>
          </div>
          <div>
            <h3 className="mb-1 font-display text-4xl font-extrabold text-sky-400">100%</h3>
            <p className="text-sm font-medium text-slate-400">Compromiso y calidez humana</p>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="mb-2 block text-sm font-bold uppercase tracking-widest text-sky-600">
            Nuestros Servicios
          </span>
          <h2 className="mb-4 font-display text-3xl font-bold text-slate-900">
            Soluciones Médicas Integrales para Ti
          </h2>
          <p className="text-slate-500">
            Infraestructura, diagnóstico clínico avanzado y un equipo multidisciplinario preparado para tu
            bienestar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-slate-200 bg-white p-9 transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-600/10"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-2xl text-sky-700">
                {service.icon}
              </div>
              <h3 className="mb-3 text-xl font-bold text-slate-900">{service.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Nosotros */}
      <section id="nosotros" className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 sm:p-14">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div>
              <span className="mb-2 block text-sm font-bold uppercase tracking-widest text-sky-600">
                Nuestra Institución
              </span>
              <h2 className="mb-4 font-display text-3xl font-bold text-slate-900">
                8 Años Comprometidos con tu Bienestar
              </h2>
              <p className="mb-4 leading-relaxed text-slate-500">
                La <strong>Clínica Sanatorio Williams</strong> se fundó con el firme propósito de acercar
                servicios médicos de calidad a la comunidad, manteniendo un trato cálido y digno para cada
                paciente.
              </p>
              <p className="leading-relaxed text-slate-500">
                Con <strong>4 médicos especialistas</strong> y <strong>25 colaboradores</strong> en áreas de
                salud, administración y atención clínica, combinamos la experiencia humana tradicional con la
                innovación tecnológica para brindarte la mejor experiencia de cuidado preventivo y correctivo.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Valores Clínicos</h3>
              <div className="mb-4">
                <strong className="text-sky-600">✓ Enfoque en el Paciente:</strong>
                <p className="text-sm text-slate-500">
                  Atención sin prisas para garantizar un diagnóstico minucioso y acertado.
                </p>
              </div>
              <div className="mb-4">
                <strong className="text-teal-700">✓ Innovación Constante:</strong>
                <p className="text-sm text-slate-500">
                  Modernización de sistemas digitales para expedientes y visualización de imágenes.
                </p>
              </div>
              <div>
                <strong className="text-amber-500">✓ Transparencia y Calidez:</strong>
                <p className="text-sm text-slate-500">
                  Un equipo de 25 personas velando por tu comodidad desde que entras por la puerta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 px-4 pb-8 pt-16 text-slate-400 md:px-8">
        <div className="mx-auto mb-12 grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-[2fr_1fr_1fr_1.5fr]">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <img
                src="../assets/Logo (Sin Fondo).png"
                alt="Sanatorio Williams"
                className="h-9 w-auto object-contain"
              />
              <h3 className="m-0 font-display text-xl font-bold text-white">Clínica Sanatorio Williams</h3>
            </div>
            <p className="text-sm leading-relaxed">
              Más de 8 años dedicados a la protección de la salud con médicos especialistas, personal calificado
              y herramientas modernas para tu bienestar.
            </p>
          </div>

          <div>
            <h4 className="mb-5 text-base text-white">Enlaces Rápidos</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#inicio" className="transition-colors hover:text-sky-400">
                  Inicio
                </a>
              </li>
              <li>
                <a href="#servicios" className="transition-colors hover:text-sky-400">
                  Servicios Médicos
                </a>
              </li>
              <li>
                <Link to="/registro-paciente" className="transition-colors hover:text-sky-400">
                  Agendar Cita
                </Link>
              </li>
              <li>
                <a href="#nosotros" className="transition-colors hover:text-sky-400">
                  Nosotros
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-base text-white">Especialidades</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#servicios" className="transition-colors hover:text-sky-400">
                  Medicina General
                </a>
              </li>
              <li>
                <a href="#servicios" className="transition-colors hover:text-sky-400">
                  Imágenes Diagnósticas
                </a>
              </li>
              <li>
                <a href="#servicios" className="transition-colors hover:text-sky-400">
                  Expedientes Clínicos
                </a>
              </li>
              <li>
                <a href="#servicios" className="transition-colors hover:text-sky-400">
                  Atención Integral
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-base text-white">Información de Contacto</h4>
            <p className="mb-2 text-sm text-slate-300">📍 Atención Médica y Consultas</p>
            <p className="mb-2 text-sm text-slate-300">📞 Teléfono: (502) 2345-6789</p>
            <p className="text-sm text-slate-300">⏰ Horarios: Lunes a Sábado de 8:00 AM a 6:00 PM</p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl border-t border-slate-800 pt-8 text-center text-sm">
          <p>© 2026 Clínica Sanatorio Williams. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePaciente;

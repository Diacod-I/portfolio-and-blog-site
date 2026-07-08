// Contact tab content for the advith.exe window (see HomeClient's homeTab
// state). No outer window chrome — that comes from Win98Window/Navbar.
// Pure presentational: no state needed, just a mailto link + social links.

const CONTACT_EMAIL = 'advithkrishnan@gmail.com'

export default function ContactView() {
  return (
    <div className="max-w-3xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6 text-center">Get in Touch with me!</h1>
      <p>
        Have a question or want to work together?
        <br />
        <br />
        Kindly ping my socials below and I&apos;ll get back to you as soon as possible.
      </p>

      <div className="mt-8 space-y-2">
        <p className="flex items-center gap-2">
          <strong>Email:</strong>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-300 hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
        <p className="flex items-center gap-2">
          <strong>LinkedIn:</strong>
          <a
            href="https://www.linkedin.com/in/advithkrishnan/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-300 hover:underline"
          >
            linkedin.com/in/advithkrishnan
          </a>
        </p>
        <p className="flex items-center gap-2">
          <strong>Twitter/X:</strong>
          <a
            href="https://x.com/advith_krishnan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-300 hover:underline"
          >
            @advith_krishnan
          </a>
        </p>
        <p className="flex items-center gap-2">
          <strong>Substack:</strong>
          <a
            href="https://substack.com/@advithkrishnan"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-300 hover:underline"
          >
            @advithkrishnan
          </a>
        </p>
      </div>
    </div>
  )
}

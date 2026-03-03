export default function Home() {
  return (
    <div className="min-h-screen font-serif" style={{ background: 'linear-gradient(135deg, #f5f0ff 0%, #eff6ff 40%, #f0fdfa 100%)' }}>
      {/* Hero */}
      <div className="flex flex-col items-center justify-center pt-24 pb-16 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-black mb-4">
          <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-400 bg-clip-text text-transparent">
            Jedro+
          </span>{' '}
          booking platform
        </h1>
        <p className="text-lg text-black max-w-xl">
          A modern appointment scheduling platform for your business.
        </p>
      </div>

      {/* Cards */}
      <div className="max-w-4xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Card 1 */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-8">
          <h2 className="text-xl font-semibold text-black mb-3">Book in a few clicks</h2>
          <p className="text-black leading-relaxed">
            Schedule an appointment in a few clicks —{' '}
            <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-400 bg-clip-text text-transparent font-medium">
              anywhere, anytime
            </span>
            . Simple for clients, powerful for your business.
          </p>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-8">
          <h2 className="text-xl font-semibold text-black mb-3">Grow effortlessly</h2>
          <p className="text-black leading-relaxed">
            <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-400 bg-clip-text text-transparent font-medium">
              Fewer
            </span>{' '}
            calls.{' '}
            <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-400 bg-clip-text text-transparent font-medium">
              More
            </span>{' '}
            bookings.{' '}
            <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-400 bg-clip-text text-transparent font-medium">
              24/7
            </span>{' '}
            scheduling. Professional impression.
          </p>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-8">
          <h2 className="text-xl font-semibold text-black mb-3">Your brand, your design</h2>
          <p className="text-black leading-relaxed">
            Choose your{' '}
            <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-400 bg-clip-text text-transparent font-medium">
              style
            </span>
            . Set{' '}
            <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-400 bg-clip-text text-transparent font-medium">
              colors
            </span>{' '}
            that match your{' '}
            <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-400 bg-clip-text text-transparent font-medium">
              brand
            </span>{' '}
            — and let the platform handle the rest.
          </p>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-8">
          <h2 className="text-xl font-semibold text-black mb-3">Built for conversion</h2>
          <p className="text-black leading-relaxed">
            Create a booking{' '}
            <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-400 bg-clip-text text-transparent font-medium">
              experience
            </span>{' '}
            that brings your clients from discovery to reservation — seamlessly.
          </p>
        </div>
      </div>
    </div>
  );
}

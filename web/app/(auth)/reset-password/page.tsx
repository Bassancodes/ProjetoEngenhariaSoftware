export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-8 left-8">
        <div className="text-sm text-gray-900 mb-1">BAXEIN WEAR - Recuperar Senha</div>
        <div className="text-2xl font-bold text-gray-800">BAXEINWEAR</div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recuperar Senha</h1>
          <p className="text-gray-900">Digite seu e-mail para receber instruções de recuperação</p>
        </div>

        {/* Form */}
        <form className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              placeholder="seuemail@exemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="button"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
            >
              ENVIAR INSTRUÇÕES
            </button>
          </div>

          {/* Back to Login Link */}
          <div className="text-center">
            <a
              href="/login"
              className="text-blue-600 hover:text-blue-800 text-sm transition-colors duration-200"
            >
              Voltar para login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

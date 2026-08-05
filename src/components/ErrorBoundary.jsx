import React from 'react'

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('⚠️ [React Error Boundary] Exceção capturada na UI:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'linear-gradient(135deg, #FAF9F5 0%, #F5EEE9 100%)' }}>
                    <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 space-y-4">
                        <div className="w-12 h-12 bg-[#7A3E4A]/10 text-[#7A3E4A] rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
                            ✨
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Meraki Femme</h2>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Ajustamos a sua conexão. Clique no botão abaixo para continuar navegando.
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null })
                                window.location.reload()
                            }}
                            className="px-6 py-3 bg-[#7A3E4A] hover:bg-[#603039] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                        >
                            Atualizar Página
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

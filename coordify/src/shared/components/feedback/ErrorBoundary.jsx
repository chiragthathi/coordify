import React from 'react'
import { ErrorFallback } from './ErrorFallback'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Centralized logging hook can be connected here.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

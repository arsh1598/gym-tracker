import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Dumbbell } from 'lucide-react'
import { useToast } from './ToastProvider'

export default function AuthModal() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Supabase requires an email, so we append a dummy domain to the username
      const dummyEmail = `${username.toLowerCase().trim()}@gymtracker.app`
      
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password
        })
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
             throw new Error('Incorrect username or password.')
          }
          throw error
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: dummyEmail,
          password,
          options: {
            data: {
              username: username.trim()
            }
          }
        })
        if (error) {
          if (error.message.includes('User already registered')) {
            throw new Error('This username is already taken. Please choose another or sign in.')
          }
          throw error
        }
        toast('Registration successful! You are now logged in.', 'success')
      }
    } catch (error) {
      toast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 9999
    }}>
      <div style={{
        background: 'var(--bg-card)', padding: '32px', borderRadius: '16px',
        width: '100%', maxWidth: '400px', border: '1px solid var(--border-subtle)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex', background: 'var(--purple-primary)', padding: '12px',
            borderRadius: '12px', marginBottom: '16px'
          }}>
            <Dumbbell size={24} color="white" />
          </div>
          <h2 style={{ color: 'white', marginBottom: '8px' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLogin ? 'Enter your details to access your workouts.' : 'Sign up to start tracking your progress.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Username</label>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g. gymbro99"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type="password" 
              className="input" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '8px', padding: '12px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            className="btn-ghost"
            style={{ border: 'none', background: 'transparent', color: 'var(--purple-light)', cursor: 'pointer', padding: 0 }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

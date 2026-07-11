'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed')) {
      redirect(`/register/verify?email=${encodeURIComponent(email)}`)
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = formData.get('display_name') as string

  if (!email || !password || !displayName) {
    return { error: 'All fields are required' }
  }

  const supabase = await createClient()

  // 1. Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: displayName,
      }
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user account' }
  }

  // 2. Generate a unique slug
  const baseSlug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'user'
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  const slug = `${baseSlug}-${randomSuffix}`

  // Since "Confirm Email" is ON, the user doesn't have a session yet.
  // We MUST use the Admin client to bypass RLS and create their profile rows.
  const supabaseAdmin = createAdminClient()

  // 3. Create profile
  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: authData.user.id,
    display_name: displayName,
    slug,
    page_title: `${displayName}'s Availability`,
    page_desc: 'My current time allocation and availability.',
  })

  if (profileError) {
    // Note: If profile creation fails but auth succeeds, it's a bit of an edge case.
    // Ideally this would be a Postgres trigger. But for now we surface the error.
    return { error: `Account created but failed to setup profile: ${profileError.message}` }
  }

  // 4. Create empty CTA
  const { error: ctaError } = await supabaseAdmin.from('cta').insert({
    user_id: authData.user.id,
  })

  if (ctaError) {
    console.error('Failed to create CTA row', ctaError)
  }

  redirect(`/register/verify?email=${encodeURIComponent(email)}`)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Use Admin client to bypass RLS and use Admin API
  const supabaseAdmin = createAdminClient()

  try {
    // 1. Manually delete public data to guarantee no orphans (even without DB ON DELETE CASCADE)
    // Order matters if there are foreign keys between them, but user_id is the root.
    await supabaseAdmin.from('time_entries').delete().eq('user_id', user.id)
    await supabaseAdmin.from('items').delete().eq('user_id', user.id)
    await supabaseAdmin.from('cta').delete().eq('user_id', user.id)
    await supabaseAdmin.from('profiles').delete().eq('id', user.id)

    // 2. Delete the user from auth.users via Admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError)
      return { error: 'Failed to delete user account' }
    }

    // 3. Sign out the local session to clear cookies
    await supabase.auth.signOut()

  } catch (err) {
    console.error('Error during account deletion:', err)
    return { error: 'An unexpected error occurred' }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function verifyRegistration(formData: FormData) {
  const email = formData.get('email') as string
  const token = formData.get('token') as string

  if (!email || !token) {
    return { error: 'Email and verification code are required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function resendVerification(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    return { error: error.message }
  }

  redirect(`/forgot-password/verify?email=${encodeURIComponent(email)}`)
}

export async function resetPasswordWithOtp(formData: FormData) {
  const email = formData.get('email') as string
  const token = formData.get('token') as string
  const password = formData.get('password') as string

  if (!email || !token || !password) {
    return { error: 'All fields are required' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  const supabase = await createClient()

  // 1. Check if we ALREADY established a session from a previous failed attempt (e.g. password too weak)
  const { data: { user } } = await supabase.auth.getUser()

  // 2. If not logged in as this user, verify OTP to establish a session
  if (!user || user.email !== email) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    })

    if (verifyError) {
      return { error: verifyError.message }
    }
  }

  // 3. Since session is established, update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: password
  })

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

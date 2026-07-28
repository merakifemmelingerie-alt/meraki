// Supabase Edge Function to handle InfinitePay payment webhooks
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify secret token from query param
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const expectedToken = Deno.env.get('WEBHOOK_SECRET') || 'default_secret_token_12345'
    if (!token || token !== expectedToken) {
      console.warn("Unauthorized webhook request attempt.")
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    const payload = await req.json()
    console.log("Received InfinitePay webhook payload:", payload)

    // InfinitePay payload usually contains metadata or reference ID
    // We expect the checkout metadata to contain the order_id
    const orderId = payload.metadata?.order_id || payload.reference_id || payload.order_id

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing order_id reference in webhook payload." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Initialize Supabase Admin client using internal env keys
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch order from database to check original total
    const { data: dbOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle()

    if (fetchError || !dbOrder) {
      console.warn(`Order ${orderId} not found in DB.`)
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Extract paid amount from payload (InfinitePay sends amount in cents or reais)
    const rawPaid = payload.amount || payload.paid_amount || payload.data?.amount || 0
    let paidReais = Number(rawPaid)
    if (paidReais > 1000 && Number(dbOrder.total) < 1000) {
      paidReais = paidReais / 100 // Convert cents to Reais
    }

    const expectedTotal = Number(dbOrder.total || 0)

    // Security Check: Verify if paid amount matches expected order total
    if (paidReais > 0 && paidReais < (expectedTotal - 0.05)) {
      console.warn(`SECURITY ALERT: Order ${orderId} expected R$ ${expectedTotal}, but received payment of R$ ${paidReais}! Marking as Valor Incorreto.`)
      await supabase
        .from('orders')
        .update({ status: 'Valor Incorreto / Suspeita de Burlar' })
        .eq('id', orderId)

      return new Response(JSON.stringify({
        warning: "Payment amount does not match order total.",
        expected: expectedTotal,
        received: paidReais
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Update order status to 'Pago' (Paid)
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'Pago' })
      .eq('id', orderId)
      .select()

    if (error) throw error

    console.log(`Successfully updated order ${orderId} status to Pago:`, data)

    return new Response(JSON.stringify({ success: true, message: `Order ${orderId} updated to Pago.` }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  } catch (err) {
    console.error("Error processing InfinitePay webhook:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})

/**
 * JLOODNA — Payment Module
 * PayPal SDK + NatCash instructions
 */

const PAYPAL_CLIENT_ID = 'AdI4wGqusD1U_r2ng3TxPlIUpNdHFN0CkoVc1bTtUuGumlKeItEm7kgy74gym9w-rPs4-D0lANzmZq5j';
const NATCASH_NUMBER   = '+509 40 89 40 38';
const HTG_TO_USD       = 0.0075; // Approximate

const Payment = {
  /** Convert HTG to USD for PayPal */
  htgToUsd(amountHTG) {
    return Math.max(0.01, (amountHTG * HTG_TO_USD)).toFixed(2);
  },

  /** Load PayPal SDK dynamically */
  loadPayPalSDK() {
    return new Promise((resolve, reject) => {
      if (window.paypal) return resolve(window.paypal);
      if (document.getElementById('paypal-sdk')) {
        document.getElementById('paypal-sdk').addEventListener('load', () => resolve(window.paypal));
        return;
      }
      const script = document.createElement('script');
      script.id  = 'paypal-sdk';
      script.src = `https://www.paypal.com/sdk/js?client-id=AdI4wGqusD1U_r2ng3TxPlIUpNdHFN0CkoVc1bTtUuGumlKeItEm7kgy74gym9w-rPs4-D0lANzmZq5j`;
      script.onload  = () => resolve(window.paypal);
      script.onerror = () => reject(new Error('PayPal SDK failed to load'));
      document.head.appendChild(script);
    });
  },

  /** Render PayPal button into a container */
  async renderPayPalButton(containerId, { amountHTG, orderId, onSuccess, onError }) {
    try {
      const paypal = await this.loadPayPalSDK();
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '<div style="text-align:center;padding:10px;font-size:12px;color:#9aa3b2">Chargement PayPal…</div>';

      const amountUSD = this.htgToUsd(amountHTG);

      paypal.Buttons({
        style: { layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', height: 45 },

        createOrder: (data, actions) => actions.order.create({
          intent: 'CAPTURE',
          purchase_units: [{
            amount: { value: amountUSD, currency_code: 'USD' },
            description: `Jloodna Order ${orderId}`,
            custom_id: orderId,
          }],
          application_context: {
            brand_name: 'Jloodna Global Trading',
            locale: 'fr-FR',
            shipping_preference: 'NO_SHIPPING',
          }
        }),

        onApprove: async (data, actions) => {
          try {
            container.innerHTML = '<div style="text-align:center;padding:16px"><span class="loader loader-dark"></span><div style="font-size:13px;color:#4a5568;margin-top:8px">Traitement du paiement…</div></div>';
            const details = await actions.order.capture();
            console.log('[PayPal] Payment captured:', details.id);
            onSuccess?.({ transactionId: details.id, payerId: details.payer?.payer_id, status: details.status });
          } catch (err) {
            console.error('[PayPal] Capture failed:', err);
            onError?.(err);
          }
        },

        onCancel: () => {
          Toast.show('warning', '⚠️ Paiement annulé', 'Vous avez annulé le paiement PayPal.');
        },

        onError: (err) => {
          console.error('[PayPal] Error:', err);
          Toast.show('error', '❌ Erreur PayPal', 'Une erreur est survenue. Réessayez ou utilisez NatCash.');
          onError?.(err);
        }
      }).render(`#${containerId}`);

    } catch (err) {
      console.error('[PayPal] SDK load error:', err);
      document.getElementById(containerId).innerHTML = `
        <div style="background:#fff3f3;border-radius:8px;padding:12px;text-align:center;font-size:13px;color:#c62828">
          ⚠️ PayPal indisponible. Utilisez NatCash ou réessayez.
        </div>`;
    }
  },

  /** Show NatCash instructions */
  renderNatCashInstructions(containerId, { amountHTG, orderId }) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div style="background:#f0f4ff;border-radius:12px;padding:20px;border:1px solid #bfdbfe">
        <div style="font-weight:700;color:#0a2342;font-size:15px;margin-bottom:12px">📱 Instructions de paiement NatCash</div>
        <div style="font-size:14px;color:#4a5568;line-height:1.9">
          <p><strong>1.</strong> Ouvrez votre application <strong>NatCash</strong></p>
          <p><strong>2.</strong> Choisissez <em>"Envoyer de l'argent"</em></p>
          <p><strong>3.</strong> Numéro destinataire:</p>
          <div style="background:#0a2342;color:#fff;border-radius:8px;padding:10px 16px;font-size:20px;font-weight:900;text-align:center;margin:8px 0;letter-spacing:2px">${NATCASH_NUMBER}</div>
          <p><strong>4.</strong> Montant exact:</p>
          <div style="background:#ff6f00;color:#fff;border-radius:8px;padding:10px 16px;font-size:22px;font-weight:900;text-align:center;margin:8px 0">${Currency.format(amountHTG)}</div>
          <p><strong>5.</strong> Motif: <code style="background:#f5f5f0;padding:2px 6px;border-radius:4px">${orderId}</code></p>
          <p><strong>6.</strong> Envoyez la capture d'écran via WhatsApp pour confirmation rapide</p>
        </div>
        <a href="https://wa.me/50940894038?text=Paiement%20NatCash%20commande%20${orderId}%20-%20${amountHTG}%20HTG"
           target="_blank" class="btn btn-success btn-block" style="background:#25d366;border-color:#25d366;margin-top:12px;display:flex;align-items:center;justify-content:center;gap:8px">
          💬 Envoyer la confirmation WhatsApp
        </a>
      </div>`;
  }
};

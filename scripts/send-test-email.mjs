import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY || 're_XLWJg81h_8RP1tmXqX1ttWULJ5UJZ5vzu';
const to = process.argv[2] || 'siamahamedab@gmail.com';

if (!apiKey) {
  console.error('RESEND_API_KEY not set. Provide via env or update the script.');
  process.exit(1);
}

const resend = new Resend(apiKey);

async function main() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to,
      subject: 'Hello World',
      html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
    });

    if (error) {
      console.error('Resend error:', error);
      process.exit(2);
    }

    console.log('Sent. Resend response id:', data?.id);
    console.log('Check https://resend.com/dashboard/emails for delivery details.');
  } catch (err) {
    console.error('Unexpected error sending email:', err);
    process.exit(3);
  }
}

main();

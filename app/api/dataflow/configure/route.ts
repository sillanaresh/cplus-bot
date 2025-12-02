import { ConnectPlusClient } from '@/lib/connectplus';

export async function POST(req: Request) {
  try {
    const { dataflowUuid, description, schedule, blocks } = await req.json();

    // Get auth from request headers
    const cookie = req.headers.get('x-connectplus-cookie');
    const orgId = req.headers.get('x-connectplus-org-id');

    if (!cookie || !orgId) {
      return new Response('Missing authentication credentials', { status: 401 });
    }

    const client = new ConnectPlusClient({ cookie, orgId });

    // Call saveDataflow with updated configuration
    const result = await client.saveDataflow({
      dataflowUuid,
      description,
      schedule: schedule || '0/1 0 * * * ? *',
      blocks,
    });

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Configure dataflow error:', error);
    return new Response(error.message || 'Internal server error', { status: 500 });
  }
}

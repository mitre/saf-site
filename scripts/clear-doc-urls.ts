import PocketBase from 'pocketbase';

async function clearBadDocUrls() {
  const pb = new PocketBase('http://localhost:8090');

  await pb.collection('_superusers').authWithPassword(
    'admin@localhost.com',
    'testpassword123'
  );

  const records = await pb.collection('content').getFullList();

  let cleared = 0;
  for (const record of records) {
    if (record.documentation_url) {
      console.log(`Clearing: ${record.slug} -> ${record.documentation_url}`);
      await pb.collection('content').update(record.id, {
        documentation_url: ''
      });
      cleared++;
    }
  }

  console.log(`\nCleared ${cleared} documentation_url fields`);
}

clearBadDocUrls().catch(console.error);

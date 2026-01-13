#!/usr/bin/env tsx
import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

async function getToken() {
  const admin = await pb.admins.authWithPassword('admin@localhost.com', 'test1234567')
  console.log(admin.token)
}

getToken()

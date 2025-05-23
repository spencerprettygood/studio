import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/chat'); // Redirect to the new chat interface
  return null; 
}

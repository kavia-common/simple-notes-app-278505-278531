import { render, screen } from '@testing-library/react';
import App from './App';

test('renders top navigation', () => {
  render(<App />);
  // Brand text "Notes" should be visible
  expect(screen.getByText(/Notes/i)).toBeInTheDocument();
});

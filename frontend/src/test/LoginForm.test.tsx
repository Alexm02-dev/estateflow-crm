import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { AuthProvider } from '../context/AuthContext';

describe('LoginPage Component', () => {
  it('renders login form with email and password fields', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByText('EstateFlow CRM')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('agent@estatecrm.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in to crm/i })).toBeInTheDocument();
  });

  it('populates fields when demo admin button is clicked', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const adminDemoBtn = screen.getByText('Admin');
    fireEvent.click(adminDemoBtn);

    const emailInput = screen.getByPlaceholderText('agent@estatecrm.com') as HTMLInputElement;
    expect(emailInput.value).toBe('admin@estatecrm.com');
  });
});

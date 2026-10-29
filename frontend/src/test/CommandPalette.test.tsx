import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { CommandPalette } from '../components/common/CommandPalette';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

const renderCommandPalette = (isOpen: boolean, onClose = vi.fn()) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <CommandPalette isOpen={isOpen} onClose={onClose} />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('CommandPalette Component', () => {
  it('does not render when isOpen is false', () => {
    renderCommandPalette(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders command palette and searchable commands when isOpen is true', () => {
    renderCommandPalette(true);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();

    expect(screen.getByText('Create New Lead')).toBeInTheDocument();
    expect(screen.getByText('New Unit Reservation Wizard')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
  });

  it('filters commands as user types query', () => {
    renderCommandPalette(true);

    const input = screen.getByPlaceholderText(/type a command/i);
    fireEvent.change(input, { target: { value: 'reservation' } });

    expect(screen.getByText('New Unit Reservation Wizard')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Overview')).not.toBeInTheDocument();
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    renderCommandPalette(true, handleClose);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });
});

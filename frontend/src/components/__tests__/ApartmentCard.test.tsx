import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ApartmentCard } from '../apartments/ApartmentCard'
import type { Apartment } from '../../types/api'
import React from 'react'

const mockApartment: Apartment = {
  id: 1,
  unit_number: '101',
  building_name: {
    id: 1,
    name: 'Test Building',
    street: 'Test St',
    neighborhood: 'Center',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01234-567',
    country: 'Brasil',
    builder_fotos: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  description: 'Nice apto',
  rental_price: 1500,
  is_available: true,
  is_furnished: false,
  is_pets_allowed: true,
  has_laundry: false,
  has_parking: true,
  has_internet: true,
  has_air_conditioning: false,
  number_of_bedrooms: 2,
  number_of_bathrooms: 1,
  square_footage: 80,
  fotos: [{ id: 1, photos: '/media/test.jpg' }],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('ApartmentCard', () => {
  it('renders basic information', () => {
    render(
      <MemoryRouter>
        <ApartmentCard apartment={mockApartment} />
      </MemoryRouter>
    )
    expect(screen.getByText('Apartamento 101')).toBeInTheDocument()
    expect(screen.getByText(/Test Building/)).toBeInTheDocument()
  })

  it('opens photo modal', async () => {
    render(
      <MemoryRouter>
        <ApartmentCard apartment={mockApartment} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByText(/Ver fotos/i))
    await waitFor(() => expect(screen.getByTestId('photo-modal')).toBeInTheDocument())
  })
})

import { describe, it, expect, vi } from 'vitest';
import { ChatService } from '../services/chatService';
import { EVENTS_ENDPOINTS } from '../constants/api';

describe('ChatService.fetchEventsByIds', () => {
  it('converts numeric ids, maps dates to Date objects', async () => {
    const mockGet = vi.fn().mockResolvedValue({
      data: [
        { id: 1, title: 'A', start_time: '2024-01-01T10:00:00Z', end_time: '2024-01-01T11:00:00Z' },
        { id: 2, title: 'B', start_time: '2024-01-02T10:00:00Z', end_time: '2024-01-02T11:00:00Z' },
      ],
    });
    const authFetch: any = { get: mockGet };
    const svc = new ChatService(authFetch);

    const res = await svc.fetchEventsByIds(['1', 'x', '2']);
    expect(res.success).toBe(true);
    expect(mockGet).toHaveBeenCalledTimes(1);
    const url = mockGet.mock.calls[0][0] as string;
    expect(url.startsWith(EVENTS_ENDPOINTS.list)).toBe(true);
    expect(res.data?.length).toBe(2);
    expect(res.data?.[0].start instanceof Date).toBe(true);
    expect(res.data?.[0].end instanceof Date).toBe(true);
    expect(res.data?.every(e => e.suggested)).toBe(true);
  });

  it('returns mock events when ids are non-numeric', async () => {
    const authFetch: any = { get: vi.fn() };
    const svc = new ChatService(authFetch);
    const res = await svc.fetchEventsByIds(['abc', 'def']);
    expect(res.success).toBe(true);
    expect(res.data?.length).toBeGreaterThan(0);
  });
});


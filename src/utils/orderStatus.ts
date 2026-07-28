import type { OrderStatus, TrackingOrder } from '@/types/order';
import { isNegativeStatus, isTerminalStatus } from '@/types/order';

export type TimelineStepState = 'completed' | 'current' | 'upcoming' | 'cancelled';

export interface TrackingTimelineStep {
  id: string;
  title: string;
  description: string;
  state: TimelineStepState;
}

export function getOrderProgress(
  orderStatus: OrderStatus,
  deliveryStatus?: string,
  orderType?: string,
) {
  const normalizedType = (orderType ?? '').trim().toLowerCase();
  const isDelivery =
    normalizedType === 'delivery' ||
    Boolean(deliveryStatus) ||
    ['picked_up', 'out_for_delivery', 'delivered'].includes(orderStatus);
  const baseSteps = [
    {
      id: 'pending',
      title: 'Order Placed',
      description: 'We received your order',
      state: 'upcoming',
    },
    {
      id: 'confirmed',
      title: 'Order Confirmed',
      description: 'The restaurant accepted your order',
      state: 'upcoming',
    },
    {
      id: 'preparing',
      title: 'Preparing your food',
      description: 'Chef is preparing your order',
      state: 'upcoming',
    },
    {
      id: 'ready',
      title: 'Ready',
      description: isDelivery
        ? 'Your order is ready for rider pickup'
        : 'Your order is ready to be served',
      state: 'upcoming',
    },
    ifDelivery(isDelivery, {
      id: 'out_for_delivery',
      title: 'Out for Delivery',
      description: 'Your order is on the way',
      state: 'upcoming',
    }),
    ifDelivery(isDelivery, {
      id: 'delivered',
      title: 'Delivered',
      description: 'Your order reached you',
      state: 'upcoming',
    }),
    {
      id: 'completed',
      title: 'Completed',
      description: 'This order is closed',
      state: 'upcoming',
    },
  ].filter((step): step is TrackingTimelineStep => step !== null);
  const statusIndex: Partial<Record<OrderStatus, number>> = {
    pending: 0,
    placed: 0,
    confirmed: 1,
    accepted: 1,
    preparing: 2,
    ready: 3,
    ready_for_pickup: 3,
    picked_up: isDelivery ? 4 : 3,
    out_for_delivery: isDelivery ? 4 : 3,
    delivered: isDelivery ? 5 : 3,
    completed: baseSteps.length - 1,
  };
  const negative = isNegativeStatus(orderStatus);
  const currentIndex = statusIndex[orderStatus] ?? 0;

  const steps = baseSteps.map((step, index) => {
    if (negative) {
      return {
        ...step,
        state: index === Math.max(0, currentIndex) ? 'cancelled' : 'upcoming',
      } satisfies TrackingTimelineStep;
    }

    return {
      ...step,
      description: getStepDescription(
        step.id,
        orderStatus,
        deliveryStatus,
        step.description,
      ),
      state:
        index < currentIndex || isTerminalStatus(orderStatus)
          ? 'completed'
          : index === currentIndex
            ? 'current'
            : 'upcoming',
    } satisfies TrackingTimelineStep;
  });

  return {
    steps,
    currentIndex,
    negative,
    terminal: isTerminalStatus(orderStatus),
    cancellable: orderStatus === 'pending' || orderStatus === 'placed',
  };
}

function ifDelivery(
  isDelivery: boolean,
  step: TrackingTimelineStep,
): TrackingTimelineStep | null {
  return isDelivery ? step : null;
}

export function getTrackingCopy(order: TrackingOrder) {
  if (order.orderStatus === 'completed') {
    return {
      title: 'Order Complete',
      subtitle: 'Thanks for ordering with Mangaale',
    };
  }
  if (order.orderStatus === 'delivered') {
    return {
      title: 'Order Delivered',
      subtitle: 'The restaurant is closing your order',
    };
  }

  if (order.orderStatus === 'rejected' || order.orderStatus === 'declined') {
    return {
      title: 'Restaurant rejected this order',
      subtitle: 'This order is no longer active',
    };
  }

  if (order.orderStatus === 'cancelled') {
    return {
      title: 'Order Cancelled',
      subtitle: 'This order is no longer active',
    };
  }

  return {
    title: 'Order Placed Successfully!',
    subtitle: 'Your delicious food is on the way',
  };
}

export function getEstimatedArrival(order: TrackingOrder) {
  if (order.orderStatus === 'delivered' || order.orderStatus === 'completed') return 'Delivered';
  if (isNegativeStatus(order.orderStatus)) return 'Unavailable';
  if (order.estimatedArrivalText) return order.estimatedArrivalText;
  if (order.estimatedMinutes && order.estimatedMinutes > 0 && order.estimatedMinutes <= 180) {
    return `${order.estimatedMinutes} mins`;
  }

  switch (order.orderStatus) {
    case 'preparing':
      return '20-30 mins';
    case 'ready':
    case 'ready_for_pickup':
    case 'picked_up':
    case 'out_for_delivery':
      return '10-20 mins';
    case 'pending':
    case 'placed':
    case 'accepted':
    case 'confirmed':
    default:
      return '30-40 mins';
  }
}

function getStepDescription(
  stepId: string,
  orderStatus: OrderStatus,
  deliveryStatus: string | undefined,
  fallback: string
) {
  if (stepId === 'confirmed' && (orderStatus === 'accepted' || orderStatus === 'confirmed')) {
    return 'Restaurant confirmed your order';
  }
  if (stepId === 'out_for_delivery' && deliveryStatus) {
    return deliveryStatus.replace(/[_-]+/g, ' ');
  }
  return fallback;
}

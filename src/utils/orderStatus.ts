import type { OrderStatus, TrackingOrder } from '@/types/order';
import { isNegativeStatus, isTerminalStatus } from '@/types/order';

export type TimelineStepState = 'completed' | 'current' | 'upcoming' | 'cancelled';

export interface TrackingTimelineStep {
  id: string;
  title: string;
  description: string;
  state: TimelineStepState;
}

const STATUS_INDEX: Partial<Record<OrderStatus, number>> = {
  pending: 0,
  placed: 0,
  confirmed: 1,
  accepted: 1,
  preparing: 2,
  ready: 3,
  ready_for_pickup: 3,
  picked_up: 3,
  out_for_delivery: 3,
  delivered: 4,
  completed: 4,
};

const BASE_STEPS: TrackingTimelineStep[] = [
  {
    id: 'placed',
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
    id: 'out_for_delivery',
    title: 'Out for Delivery',
    description: 'Your order is on the way',
    state: 'upcoming',
  },
  {
    id: 'delivered',
    title: 'Delivered',
    description: 'Enjoy your meal',
    state: 'upcoming',
  },
];

export function getOrderProgress(orderStatus: OrderStatus, deliveryStatus?: string) {
  const negative = isNegativeStatus(orderStatus);
  const currentIndex = STATUS_INDEX[orderStatus] ?? 0;
  const readyLabel = orderStatus === 'ready' || orderStatus === 'ready_for_pickup'
    ? 'Ready for Dispatch'
    : 'Out for Delivery';

  const steps = BASE_STEPS.map((step, index) => {
    let title = step.title;
    let description = step.description;
    if (step.id === 'out_for_delivery') {
      title = readyLabel;
      if (readyLabel === 'Ready for Dispatch') {
        description = 'The restaurant is packing your order';
      }
    }

    if (negative) {
      return {
        ...step,
        title,
        description,
        state: index === Math.max(0, currentIndex) ? 'cancelled' : 'upcoming',
      } satisfies TrackingTimelineStep;
    }

    return {
      ...step,
      title,
      description: getStepDescription(step.id, orderStatus, deliveryStatus, description),
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

export function getTrackingCopy(order: TrackingOrder) {
  if (order.orderStatus === 'delivered' || order.orderStatus === 'completed') {
    return {
      title: 'Order Delivered!',
      subtitle: 'Thanks for ordering with Mangaale',
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

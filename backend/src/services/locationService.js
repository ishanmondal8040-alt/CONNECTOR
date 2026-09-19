import prisma from "../config/prisma.js";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  bio: true,
  profileImage: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
};

// Distance calculation using Haversine Formula
const calculateDistance = (
  latitude1,
  longitude1,
  latitude2,
  longitude2
) => {
  const earthRadiusKm = 6371;

  const toRadians = (degree) =>
    degree * (Math.PI / 180);

  const latitudeDifference = toRadians(
    latitude2 - latitude1
  );

  const longitudeDifference = toRadians(
    longitude2 - longitude1
  );

  const firstLatitude = toRadians(latitude1);
  const secondLatitude = toRadians(latitude2);

  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const centralAngle =
    2 *
    Math.atan2(
      Math.sqrt(value),
      Math.sqrt(1 - value)
    );

  return earthRadiusKm * centralAngle;
};

export const updateUserLocation = async (
  userId,
  latitude,
  longitude
) => {
  const numericLatitude = Number(latitude);
  const numericLongitude = Number(longitude);

  if (
    !Number.isFinite(numericLatitude) ||
    !Number.isFinite(numericLongitude)
  ) {
    throw new Error(
      "Latitude and longitude must be valid numbers."
    );
  }

  if (
    numericLatitude < -90 ||
    numericLatitude > 90
  ) {
    throw new Error(
      "Latitude must be between -90 and 90."
    );
  }

  if (
    numericLongitude < -180 ||
    numericLongitude > 180
  ) {
    throw new Error(
      "Longitude must be between -180 and 180."
    );
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      latitude: numericLatitude,
      longitude: numericLongitude,
    },
    select: safeUserSelect,
  });
};

export const getNearbyUsers = async (
  userId,
  radius = 5
) => {
  const numericRadius = Number(radius);

  if (
    !Number.isFinite(numericRadius) ||
    numericRadius <= 0
  ) {
    throw new Error(
      "Radius must be a valid positive number."
    );
  }

  if (numericRadius > 100) {
    throw new Error(
      "Radius cannot be greater than 100 km."
    );
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      latitude: true,
      longitude: true,
    },
  });

  if (!currentUser) {
    throw new Error("User not found.");
  }

  if (
    currentUser.latitude === null ||
    currentUser.longitude === null
  ) {
    throw new Error(
      "Please update your location first."
    );
  }

  const users = await prisma.user.findMany({
    where: {
      id: {
        not: userId,
      },
      latitude: {
        not: null,
      },
      longitude: {
        not: null,
      },
    },
    select: safeUserSelect,
  });

  const nearbyUsers = users
    .map((user) => {
      const distance = calculateDistance(
        currentUser.latitude,
        currentUser.longitude,
        user.latitude,
        user.longitude
      );

      return {
        ...user,
        distance: Number(distance.toFixed(2)),
        distanceText:
          distance < 1
            ? `${Math.round(distance * 1000)} m away`
            : `${distance.toFixed(2)} km away`,
      };
    })
    .filter(
      (user) => user.distance <= numericRadius
    )
    .sort(
      (firstUser, secondUser) =>
        firstUser.distance - secondUser.distance
    );

  return {
    radius: numericRadius,
    users: nearbyUsers,
  };
};
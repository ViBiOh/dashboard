package commons

import (
	"context"
	"time"
)

var (
	// DefaultTimeout for context operation
	DefaultTimeout = 30 * time.Second
)

// GetCtx obtains a default timeout context
func GetCtx() (context.Context, context.CancelFunc) {
	return GetTimeoutCtx(&DefaultTimeout)
}

// GetTimeoutCtx obtains a given duration context
func GetTimeoutCtx(timeout *time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), *timeout)
}

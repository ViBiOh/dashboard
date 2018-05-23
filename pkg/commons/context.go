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
func GetCtx(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, DefaultTimeout)
}

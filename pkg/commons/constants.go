package commons

import "errors"

const (
	// OwnerLabel mark owner of stack
	OwnerLabel = `owner`

	// AppLabel mark name of stack
	AppLabel = `app`

	// IgnoredByteLogSize number of bytes ignored for logs
	IgnoredByteLogSize = 8
)

// ErrUserRequired occurs when an user if required
var ErrUserRequired = errors.New(`an user is required`)

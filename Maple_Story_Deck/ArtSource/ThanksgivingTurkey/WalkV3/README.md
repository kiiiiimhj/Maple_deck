# Walking + pupils revision

Native112, common foot baseline79. Feet use one consistent generated foot shape with alternating ground contact and a short low recovery arc. Frame4 and frame6 no longer use the old pointed foot silhouettes.

Pupil artwork was generated from a close-up, clipped into the original eye whites, and registered across every open-eyed idle/walk/death frame. Closed-eye frames and the rest of the upper-body pixels are retained.

Runtime change: only the IdleFrames, WalkFrames and DieFrames resource arrays in ThanksgivingMonsterLogic.mlua. Animation intervals, currency logic, UI layout and all other gameplay code are preserved.

package com.ethos.store;

import com.ethos.exception.DuplicateAccountException;
import com.ethos.exception.DuplicateTagException;
import com.ethos.model.User;
import com.ethos.model.UserSearchResult;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.postgresql.util.PSQLException;

public class UserStore {

    private final Jdbi jdbi;

    private static final RowMapper<User> USER_MAPPER = (rs, ctx) -> new User(
            rs.getObject("id", UUID.class),
            rs.getString("supertokens_user_id"),
            rs.getString("display_name"),
            rs.getString("tag"),
            rs.getString("email"),
            rs.getObject("avatar_id", UUID.class),
            rs.getTimestamp("created_at").toInstant());

    public UserStore(Jdbi jdbi) {
        this.jdbi = jdbi;
    }

    public User insert(User user) {
        try {
            return jdbi.withHandle(handle -> handle.createQuery(
                            """
                            INSERT INTO users (supertokens_user_id, display_name, tag, email)
                            VALUES (:supertokensUserId, :displayName, :tag, :email)
                            RETURNING id, supertokens_user_id, display_name, tag, email, avatar_id, created_at
                            """)
                    .bind("supertokensUserId", user.supertokensUserId())
                    .bind("displayName", user.displayName())
                    .bind("tag", user.tag())
                    .bind("email", user.email())
                    .map(USER_MAPPER)
                    .one());
        } catch (UnableToExecuteStatementException e) {
            rethrowIfUniqueViolation(e);
            throw e;
        }
    }

    public Optional<User> findById(UUID id) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        SELECT id, supertokens_user_id, display_name, tag, email, avatar_id, created_at
                        FROM users
                        WHERE id = :id
                        """)
                .bind("id", id)
                .map(USER_MAPPER)
                .findOne());
    }

    public Optional<User> findBySupertokensUserId(String supertokensUserId) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        SELECT id, supertokens_user_id, display_name, tag, email, avatar_id, created_at
                        FROM users
                        WHERE supertokens_user_id = :supertokensUserId
                        """)
                .bind("supertokensUserId", supertokensUserId)
                .map(USER_MAPPER)
                .findOne());
    }

    public Optional<User> update(UUID id, String displayName) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        UPDATE users SET display_name = :displayName WHERE id = :id
                        RETURNING id, supertokens_user_id, display_name, tag, email, avatar_id, created_at
                        """)
                .bind("id", id)
                .bind("displayName", displayName)
                .map(USER_MAPPER)
                .findOne());
    }

    public List<UserSearchResult> findByTagPrefix(String prefix, UUID callerUserId, int limit) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        SELECT u.id, u.display_name, u.tag, u.avatar_id,
                               (c.contact_user_id IS NOT NULL) AS is_contact
                        FROM users u
                        LEFT JOIN contacts c
                          ON c.user_id = :callerUserId AND c.contact_user_id = u.id
                        WHERE u.tag LIKE :prefix
                          AND u.id != :callerUserId
                        ORDER BY u.tag ASC
                        LIMIT :limit
                        """)
                .bind("prefix", prefix + "%")
                .bind("callerUserId", callerUserId)
                .bind("limit", limit)
                .map((rs, ctx) -> new UserSearchResult(
                        rs.getObject("id", UUID.class),
                        rs.getString("display_name"),
                        rs.getString("tag"),
                        rs.getObject("avatar_id", UUID.class),
                        rs.getBoolean("is_contact")))
                .list());
    }

    public List<User> findAllContacts(UUID userId) {
        return jdbi.withHandle(handle -> handle.createQuery(
                        """
                        SELECT u.id, u.supertokens_user_id, u.display_name, u.tag, u.email, u.avatar_id, u.created_at
                        FROM contacts c
                        JOIN users u ON u.id = c.contact_user_id
                        WHERE c.user_id = :userId
                        ORDER BY u.display_name ASC
                        """)
                .bind("userId", userId)
                .map(USER_MAPPER)
                .list());
    }

    /** Returns true if the row was inserted, false if the contact already exists. */
    public boolean insertContact(UUID userId, UUID contactUserId) {
        try {
            jdbi.useHandle(handle -> handle.createUpdate(
                            """
                            INSERT INTO contacts (user_id, contact_user_id)
                            VALUES (:userId, :contactUserId)
                            """)
                    .bind("userId", userId)
                    .bind("contactUserId", contactUserId)
                    .execute());
            return true;
        } catch (UnableToExecuteStatementException e) {
            if (e.getCause() instanceof PSQLException psql && "23505".equals(psql.getSQLState())) {
                return false;
            }
            throw e;
        }
    }

    /** Returns true if the row was deleted, false if it did not exist. */
    public boolean deleteContact(UUID userId, UUID contactUserId) {
        return jdbi.withHandle(handle -> handle.createUpdate(
                                """
                                DELETE FROM contacts
                                WHERE user_id = :userId AND contact_user_id = :contactUserId
                                """)
                        .bind("userId", userId)
                        .bind("contactUserId", contactUserId)
                        .execute())
                > 0;
    }

    private static void rethrowIfUniqueViolation(UnableToExecuteStatementException e) {
        if (e.getCause() instanceof PSQLException psql && "23505".equals(psql.getSQLState())) {
            var msg = psql.getServerErrorMessage();
            if (msg != null && "users_tag_key".equals(msg.getConstraint())) {
                throw new DuplicateTagException();
            }
            throw new DuplicateAccountException();
        }
    }
}
